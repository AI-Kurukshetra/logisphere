import type { Database } from "@/types/database";

export type EvaluationResult = {
  triggered: boolean;
  title: string;
  message: string;
  type: string;
  metadata: Record<string, unknown>;
};

type AlertRule = Database["public"]["Tables"]["alert_rules"]["Row"];
type SupabaseClient = any;
type Invoice = { amount: number | string };
type Carrier = { id: string; on_time_rate: number | null };
type InvoiceWithDueDate = { id: string; due_date: string };
type Contract = { id: string; carrier_id: string; sla: any };

export async function evaluateCostOverrun(
  supabase: SupabaseClient,
  rule: AlertRule,
  companyId: string
): Promise<EvaluationResult> {
  // Query budget_plans for planned amount (current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: budgets } = await supabase
    .from("budget_plans")
    .select("planned_amount")
    .eq("company_id", companyId)
    .gte("period_start", startOfMonth)
    .lte("period_end", endOfMonth);

  const plannedAmount =
    budgets?.[0]?.planned_amount ?? 0;

  // Query invoices for actual spend (current month)
  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("company_id", companyId)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  const actualAmount = invoices?.reduce(
    (sum: number, inv: Invoice) => sum + (Number(inv.amount) || 0),
    0
  ) ?? 0;

  const triggered =
    plannedAmount > 0 &&
    ((actualAmount - plannedAmount) / plannedAmount) * 100 >
      rule.threshold;

  const overagePercent = plannedAmount > 0
    ? (((actualAmount - plannedAmount) / plannedAmount) * 100).toFixed(2)
    : "N/A";

  return {
    triggered,
    title: "Cost Overrun Alert",
    message: `Freight costs exceeded budget by ${overagePercent}%. Planned: $${plannedAmount.toFixed(
      2
    )}, Actual: $${actualAmount.toFixed(2)}.`,
    type: "cost_overrun",
    metadata: {
      plannedAmount,
      actualAmount,
      overagePercent,
      threshold: rule.threshold,
    },
  };
}

export async function evaluateServiceFailure(
  supabase: SupabaseClient,
  rule: AlertRule,
  companyId: string
): Promise<EvaluationResult> {
  // Query carrier_metrics for on-time rate
  const carrierId = (rule.condition as any)?.carrier_id;

  let query = supabase
    .from("carrier_metrics")
    .select("carrier_id, carriers(name), on_time_rate")
    .eq("company_id", companyId);

  if (carrierId) {
    query = query.eq("carrier_id", carrierId);
  }

  const { data: metrics } = await query;

  const failedCarriers =
    metrics?.filter((m: Carrier) => (m.on_time_rate || 0) < rule.threshold) ?? [];

  return {
    triggered: failedCarriers.length > 0,
    title: "Service Failure Alert",
    message: `${failedCarriers.length} carrier(s) have on-time rate below ${rule.threshold}%. ${failedCarriers
      .map((f: Carrier) => `${(f as any).carriers?.name || "Unknown"}: ${f.on_time_rate}%`)
      .join(", ")}`,
    type: "service_failure",
    metadata: {
      failedCarrierCount: failedCarriers.length,
      failedCarriers: failedCarriers.map((f: Carrier) => ({
        carrierId: f.id,
        carrierName: (f as any).carriers?.name,
        onTimeRate: f.on_time_rate,
      })),
      threshold: rule.threshold,
    },
  };
}

export async function evaluateCriticalExceptions(
  supabase: SupabaseClient,
  rule: AlertRule,
  companyId: string
): Promise<EvaluationResult> {
  // Count invoices with exception or disputed status
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact" })
    .eq("company_id", companyId)
    .in("status", ["exception", "disputed"]);

  const triggered = (count ?? 0) > rule.threshold;

  return {
    triggered,
    title: "Critical Exceptions Alert",
    message: `${count} invoices have exception or disputed status, exceeding threshold of ${rule.threshold}.`,
    type: "invoice_exception",
    metadata: {
      exceptionCount: count,
      threshold: rule.threshold,
    },
  };
}

export async function evaluatePaymentDelay(
  supabase: SupabaseClient,
  rule: AlertRule,
  companyId: string
): Promise<EvaluationResult> {
  // Count overdue invoices (due_date < now and status = pending)
  const now = new Date().toISOString();
  const daysThreshold = Math.floor(rule.threshold);

  const { data: overdue } = await supabase
    .from("invoices")
    .select("id, due_date")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .lt("due_date", now);

  // Filter by threshold days
  const daysAgo = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const severelyOverdue = overdue?.filter((inv: InvoiceWithDueDate) => inv.due_date <= daysAgo) ?? [];

  return {
    triggered: severelyOverdue.length > 0,
    title: "Payment Delay Alert",
    message: `${severelyOverdue.length} invoice(s) overdue by more than ${daysThreshold} day(s).`,
    type: "payment_delay",
    metadata: {
      overdueCount: severelyOverdue.length,
      daysThreshold,
    },
  };
}

export async function evaluateCarrierSla(
  supabase: SupabaseClient,
  rule: AlertRule,
  companyId: string
): Promise<EvaluationResult> {
  // Compare contracts.sla on_time_percent vs carrier_metrics.on_time_rate
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, carrier_id, sla, carriers(name)")
    .eq("company_id", companyId);

  const breaches: typeof contracts = [];

  for (const contract of contracts ?? []) {
    const slaPercent = (contract.sla as any)?.on_time_percent ?? 100;

    const { data: metrics } = await supabase
      .from("carrier_metrics")
      .select("on_time_rate")
      .eq("carrier_id", contract.carrier_id)
      .eq("company_id", companyId);

    const actualRate = metrics?.[0]?.on_time_rate ?? 100;
    const gap = slaPercent - actualRate;

    if (gap > rule.threshold) {
      breaches.push(contract);
    }
  }

  return {
    triggered: breaches.length > 0,
    title: "Carrier SLA Breach Alert",
    message: `${breaches.length} carrier SLA(s) breached with gap > ${rule.threshold}%.`,
    type: "carrier_sla",
    metadata: {
      breachCount: breaches.length,
      breaches: breaches.map((b: Contract) => ({
        contractId: b.id,
        carrierId: b.carrier_id,
        carrierName: (b as any).carriers?.name,
      })),
      threshold: rule.threshold,
    },
  };
}

export async function evaluateAllRules(
  supabase: SupabaseClient,
  companyId: string,
  rules: AlertRule[]
): Promise<
  Array<{
    rule: AlertRule;
    result: EvaluationResult;
  }>
> {
  const results: Array<{ rule: AlertRule; result: EvaluationResult }> = [];

  for (const rule of rules) {
    let result: EvaluationResult;

    switch (rule.type) {
      case "cost_overrun":
        result = await evaluateCostOverrun(supabase, rule, companyId);
        break;
      case "service_failure":
        result = await evaluateServiceFailure(supabase, rule, companyId);
        break;
      case "invoice_exception":
        result = await evaluateCriticalExceptions(supabase, rule, companyId);
        break;
      case "payment_delay":
        result = await evaluatePaymentDelay(supabase, rule, companyId);
        break;
      case "carrier_sla":
        result = await evaluateCarrierSla(supabase, rule, companyId);
        break;
      default:
        continue;
    }

    results.push({ rule, result });
  }

  return results;
}
