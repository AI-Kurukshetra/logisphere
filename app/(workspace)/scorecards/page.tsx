import { CarrierSparkline } from "@/app/_components/carrier-sparkline";
import { requirePermission } from "@/lib/supabase/session";

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Open-ended";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Open-ended";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default async function ScorecardsPage() {
  const { company, supabase } = await requirePermission("audit.read");
  const companyId = company!.id;

  const [carriersRes, contractsRes, ratesRes, shipmentsRes, invoicesRes, disputesRes, metricsRes] =
    await Promise.all([
      supabase.from("carriers").select("id, name, status, code").order("name"),
      supabase
        .from("contracts")
        .select("id, carrier_id, name, effective_from, effective_to, sla")
        .eq("company_id", companyId),
      supabase
        .from("rates")
        .select("id, carrier_id, rate_amount, effective_from, effective_to"),
      supabase
        .from("shipments")
        .select("id, carrier_id, status, delivered_at, created_at")
        .eq("company_id", companyId),
      supabase
        .from("invoices")
        .select("id, carrier_id, status, approval_status")
        .eq("company_id", companyId),
      supabase.from("invoice_disputes").select("id, invoice_id, status, resolved_at"),
      supabase
        .from("performance_metrics")
        .select("id, carrier_id, period_start, period_end, on_time_rate, damage_rate, billing_accuracy, score")
        .eq("company_id", companyId),
    ]);

  const carriers = carriersRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const rates = ratesRes.data ?? [];
  const shipments = shipmentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const disputes = disputesRes.data ?? [];
  const metrics = metricsRes.data ?? [];
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  const latestMetricByCarrier = new Map<string, (typeof metrics)[number]>();
  const allMetricsByCarrier = new Map<string, (typeof metrics)>();
  for (const metric of metrics) {
    if (!latestMetricByCarrier.has(metric.carrier_id)) {
      latestMetricByCarrier.set(metric.carrier_id, metric);
    }
    if (!allMetricsByCarrier.has(metric.carrier_id)) {
      allMetricsByCarrier.set(metric.carrier_id, []);
    }
    allMetricsByCarrier.get(metric.carrier_id)!.push(metric);
  }

  // Sort metrics chronologically for sparklines
  for (const carrierMetrics of allMetricsByCarrier.values()) {
    carrierMetrics.sort((a, b) =>
      new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
    );
  }

  const rows = carriers.map((carrier) => {
    const carrierShipments = shipments.filter((shipment) => shipment.carrier_id === carrier.id);
    const carrierInvoices = invoices.filter((invoice) => invoice.carrier_id === carrier.id);
    const carrierDisputes = disputes.filter((dispute) => {
      const invoice = invoiceById.get(dispute.invoice_id);
      return invoice?.carrier_id === carrier.id;
    });
    const carrierContracts = contracts.filter((contract) => contract.carrier_id === carrier.id);
    const carrierRates = rates.filter((rate) => rate.carrier_id === carrier.id);
    const metric = latestMetricByCarrier.get(carrier.id);

    const deliveredCount = carrierShipments.filter((shipment) => shipment.status === "delivered").length;
    const healthyCount = carrierShipments.filter((shipment) => shipment.status !== "exception").length;
    const cleanInvoiceCount = carrierInvoices.filter(
      (invoice) => !["exception", "disputed"].includes(invoice.status)
    ).length;

    const onTime = metric
      ? Number(metric.on_time_rate ?? 0)
      : carrierShipments.length
        ? (deliveredCount / carrierShipments.length) * 100
        : 0;
    const billingAccuracy = metric
      ? Number(metric.billing_accuracy ?? 0)
      : carrierInvoices.length
        ? (cleanInvoiceCount / carrierInvoices.length) * 100
        : 0;
    const damageRate = metric
      ? Number(metric.damage_rate ?? 0)
      : carrierShipments.length
        ? ((carrierShipments.length - healthyCount) / carrierShipments.length) * 100
        : 0;
    const score = metric
      ? Number(metric.score ?? 0)
      : Math.round((onTime + billingAccuracy + Math.max(0, 100 - damageRate * 10)) / 3);

    const nextContract = carrierContracts
      .slice()
      .sort((left, right) => left.effective_to?.localeCompare(right.effective_to ?? "") ?? -1)[0];
    const openDisputeCount = carrierDisputes.filter((dispute) => dispute.status === "open").length;
    const complianceState =
      openDisputeCount > 0
        ? "Needs action"
        : carrier.status !== "active"
          ? "Carrier paused"
          : carrierRates.length === 0
            ? "Missing rates"
            : "Healthy";

    const carrierMetrics = allMetricsByCarrier.get(carrier.id) ?? [];
    const sparklineData = carrierMetrics.map((m) => ({
      onTimeRate: Number(m.on_time_rate ?? 0),
      period: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
      }).format(new Date(m.period_start)),
    }));

    return {
      billingAccuracy,
      carrier,
      complianceState,
      damageRate,
      nextContract,
      onTime,
      openDisputeCount,
      rateCount: carrierRates.length,
      score,
      shipmentCount: carrierShipments.length,
      sparklineData,
    };
  });

  const openComplianceItems = rows.filter((row) => row.complianceState !== "Healthy");
  const avgScore = rows.length
    ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#122c34_0%,#1d4ed8_52%,#1e293b_100%)] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Phase 2 Scorecards
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Carrier performance and compliance monitoring
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50">
          Score service quality, watch contract health, and surface dispute risk before it turns
          into spend leakage.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Carrier Score Avg", value: avgScore.toFixed(1), note: "Across active carriers" },
          { label: "Open Compliance Items", value: String(openComplianceItems.length), note: "Rates, disputes, or status issues" },
          { label: "Open Disputes", value: String(disputes.filter((item) => item.status === "open").length), note: "Across all carriers" },
          { label: "Active Contracts", value: String(contracts.length), note: "Tenant-scoped agreements" },
        ].map((card) => (
          <article key={card.label} className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Carrier Scorecards
          </p>
          <div className="mt-5 space-y-4">
            {rows.length === 0 ? (
              <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No carrier records yet.
              </p>
            ) : (
              rows.map((row) => (
                <article key={row.carrier.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-950">{row.carrier.name}</h2>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                          {row.carrier.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                            row.complianceState === "Healthy"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.complianceState}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {row.shipmentCount} shipments · {row.rateCount} rates · {row.openDisputeCount} open disputes
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-slate-950 px-4 py-3 text-center text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Score</p>
                      <p className="mt-2 text-2xl font-semibold">{row.score.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.2rem] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">On-time</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{formatPercent(row.onTime)}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Billing Accuracy</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{formatPercent(row.billingAccuracy)}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Damage Rate</p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">{row.damageRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {row.sparklineData.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
                        On-Time Performance Trend
                      </p>
                      <CarrierSparkline data={row.sparklineData} />
                    </div>
                  )}
                  <p className="mt-4 text-sm text-slate-600">
                    Contract window: {formatDate(row.nextContract?.effective_from ?? null)} to{" "}
                    {formatDate(row.nextContract?.effective_to ?? null)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Compliance Watchlist
            </p>
            <div className="mt-5 space-y-3">
              {openComplianceItems.length === 0 ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No compliance issues detected.
                </p>
              ) : (
                openComplianceItems.map((item) => (
                  <div key={item.carrier.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{item.carrier.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.complianceState === "Missing rates"
                        ? "Carrier has shipments or contracts without active rate coverage."
                        : item.complianceState === "Carrier paused"
                          ? "Carrier is inactive but still appears in tenant data and should be reviewed."
                          : "Carrier has open disputes that need financial resolution."}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Network Snapshot
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-700">
                {shipments.filter((shipment) => shipment.status === "exception").length} shipment exceptions
                currently affect carrier SLAs.
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-700">
                {invoices.filter((invoice) => ["exception", "disputed"].includes(invoice.status)).length} finance
                issues are visible in invoice quality checks.
              </div>
              <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm text-slate-700">
                {contracts.filter((contract) => contract.effective_to && new Date(contract.effective_to) < new Date(Date.now() + 45 * 86400000)).length} contracts
                expire within the next 45 days.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
