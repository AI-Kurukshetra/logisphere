import { FreightSpendChart } from "@/app/_components/freight-spend-chart";
import { requirePermission } from "@/lib/supabase/session";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "No timestamp";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No timestamp";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(parsed);
}

export default async function AnalyticsPage() {
  const { company, supabase } = await requirePermission("audit.read");
  const companyId = company!.id;

  const [invoicesRes, paymentsRes, alertsRes, auditsRes, shipmentsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, status, approval_status, created_at, due_date")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, invoice_id, amount, status, paid_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("id, title, type, message, read, metadata, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("audits")
      .select("id, invoice_id, variance_amount, result, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("shipments")
      .select("id, status, created_at")
      .eq("company_id", companyId),
  ]);

  const invoices = invoicesRes.data ?? [];
  const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
  const payments = (paymentsRes.data ?? []).filter((payment) => invoiceIds.has(payment.invoice_id));
  const alerts = alertsRes.data ?? [];
  const audits = (auditsRes.data ?? []).filter((audit) => invoiceIds.has(audit.invoice_id));
  const shipments = shipmentsRes.data ?? [];

  const totalFreightSpend = invoices.reduce((sum: number, invoice) => sum + Number(invoice.amount), 0);
  const pendingLiability = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum: number, invoice) => sum + Number(invoice.amount), 0);
  const exceptionExposure = invoices
    .filter((invoice) => ["exception", "disputed"].includes(invoice.status))
    .reduce((sum: number, invoice) => sum + Number(invoice.amount), 0);
  const auditedInvoiceCount = new Set(audits.map((audit) => audit.invoice_id)).size;
  const auditCoverage = invoices.length ? (auditedInvoiceCount / invoices.length) * 100 : 0;
  const unreadAlerts = alerts.filter((alert) => !alert.read).length;
  const shipmentExceptionRate = shipments.length
    ? (shipments.filter((shipment) => shipment.status === "exception").length / shipments.length) * 100
    : 0;
  const recoveredVariance = audits.reduce((sum: number, audit) => sum + Number(audit.variance_amount ?? 0), 0);
  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const completedPaymentTotal = completedPayments.reduce(
    (sum: number, payment) => sum + Number(payment.amount),
    0
  );

  const trendBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      amount: 0,
      count: 0,
      key,
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    };
  });

  const bucketMap = new Map(trendBuckets.map((bucket) => [bucket.key, bucket]));
  for (const invoice of invoices) {
    const createdAt = new Date(invoice.created_at);
    if (Number.isNaN(createdAt.getTime())) continue;
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.amount += Number(invoice.amount);
    bucket.count += 1;
  }

  const maxTrendAmount = Math.max(...trendBuckets.map((bucket) => bucket.amount), 1);
  const recommendations = [
    exceptionExposure > 0
      ? `Finance exposure sits at ${formatCurrency(exceptionExposure)} across disputed or exception invoices.`
      : "No disputed invoice exposure is currently open.",
    unreadAlerts > 0
      ? `${unreadAlerts} alerts are still unread and should be routed to the operating owner.`
      : "Alert queue is fully acknowledged.",
    shipmentExceptionRate > 0
      ? `Shipment exception rate is ${formatPercent(shipmentExceptionRate)} and is worth reviewing with carrier ops.`
      : "No shipment exceptions are visible in the current tenant data.",
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#0f766e_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Phase 2 Analytics
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Cost visibility, savings signals, and live alerting
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50">
          Freight spend, audit coverage, and exception pressure for {company?.name} in one
          operating view.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Spend",
            note: `${invoices.length} invoices in scope`,
            value: formatCurrency(totalFreightSpend),
          },
          {
            label: "Pending Liability",
            note: "Approved, pending, and exception invoices",
            value: formatCurrency(pendingLiability),
          },
          {
            label: "Audit Coverage",
            note: `${auditedInvoiceCount} invoices audited`,
            value: formatPercent(auditCoverage),
          },
          {
            label: "Recovered Variance",
            note: "Flagged by audit rules",
            value: formatCurrency(recoveredVariance),
          },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Spend Trend
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Invoice volume and freight spend
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Live
            </span>
          </div>
          <FreightSpendChart data={trendBuckets} maxAmount={maxTrendAmount} />
          <div className="space-y-2">
            {trendBuckets.map((bucket) => (
              <div key={bucket.key} className="flex items-center justify-between text-sm text-slate-600 px-2">
                <span>{bucket.label}</span>
                <span>{formatCurrency(bucket.amount)} · {bucket.count} invoices</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Alert Center
            </p>
            <div className="mt-5 space-y-3">
              {alerts.length === 0 ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No active alerts.
                </p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                          alert.read ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {alert.read ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {alert.message || "No alert body"}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {alert.type} · {formatDate(alert.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Operating Guidance
            </p>
            <div className="mt-5 space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {recommendation}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Shipment Exception Rate
                </p>
                <p className="mt-3 text-2xl font-semibold">{formatPercent(shipmentExceptionRate)}</p>
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Completed Payments
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {formatCurrency(completedPaymentTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
