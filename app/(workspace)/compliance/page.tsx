import { requirePermission } from "@/lib/supabase/session";

type ContractComplianceRow = {
  id: string;
  carrier_id: string;
  carriers: { name: string | null }[] | null;
  sla: { on_time_percent?: number } | null;
};

type CarrierMetricComplianceRow = {
  carrier_id: string;
  on_time_rate: number | null;
};

type ShipmentComplianceRow = {
  id: string;
  tracking_number: string;
  status: string;
  created_at: string;
};

type DocumentComplianceRow = {
  shipment_id: string;
  document_type: string;
};

type InvoiceComplianceRow = {
  approval_status: string | null;
  due_date: string | null;
  status: string;
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default async function CompliancePage() {
  const { company, supabase } = await requirePermission("audit.read");
  const companyId = company!.id;

  const [contractsRes, metricsRes, shipmentsRes, documentsRes, invoiceDisputesRes, alertRulesRes, alertsRes, invoicesRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, carrier_id, sla, carriers(name)")
      .eq("company_id", companyId),
    supabase
      .from("carrier_metrics")
      .select("id, carrier_id, on_time_rate, carriers(name)")
      .eq("company_id", companyId),
    supabase
      .from("shipments")
      .select("id, tracking_number, status, created_at")
      .eq("company_id", companyId),
    supabase
      .from("documents")
      .select("id, shipment_id, document_type, created_at")
      .eq("company_id", companyId),
    supabase
      .from("invoice_disputes")
      .select("id, invoice_id, status, carrier_id, invoices(carrier_id)")
      .eq("status", "open"),
    supabase
      .from("alert_rules")
      .select("id, name, type, enabled")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("id, title, type, read, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("invoices")
      .select("id, due_date, status, approval_status")
      .eq("company_id", companyId),
  ]);

  const contracts = (contractsRes.data ?? []) as ContractComplianceRow[];
  const metrics = (metricsRes.data ?? []) as CarrierMetricComplianceRow[];
  const shipments = (shipmentsRes.data ?? []) as ShipmentComplianceRow[];
  const documents = (documentsRes.data ?? []) as DocumentComplianceRow[];
  const invoiceDisputes = invoiceDisputesRes.data ?? [];
  const alertRules = alertRulesRes.data ?? [];
  const alerts = alertsRes.data ?? [];
  const invoices = (invoicesRes.data ?? []) as InvoiceComplianceRow[];

  // SLA Breach Analysis
  const slaBreaches = contracts
    .map((contract) => {
      const slaPercent = contract.sla?.on_time_percent ?? 100;
      const metric = metrics.find((m) => m.carrier_id === contract.carrier_id);
      const actualRate = (metric?.on_time_rate ?? 100) as number;
      const isBreaching = actualRate < slaPercent;

      return {
        actualRate,
        carrierId: contract.carrier_id,
        carrierName: contract.carriers?.[0]?.name || "Unknown Carrier",
        contractId: contract.id,
        isBreaching,
        slaPercent,
      };
    })
    .sort((a, b) => Number(b.isBreaching) - Number(a.isBreaching));

  const breachingCount = slaBreaches.filter((b) => b.isBreaching).length;

  // Document Completeness Analysis
  const requiredDocTypes = ["bill_of_lading", "proof_of_delivery"];
  const deliveredShipments = shipments.filter((s) => s.status === "delivered");
  const documentsByShipment = new Map<string, Set<string>>();

  for (const doc of documents) {
    if (!documentsByShipment.has(doc.shipment_id)) {
      documentsByShipment.set(doc.shipment_id, new Set());
    }
    documentsByShipment.get(doc.shipment_id)!.add(doc.document_type);
  }

  const incompleteShipments = deliveredShipments.filter((shipment) => {
    const docsForShipment = documentsByShipment.get(shipment.id) ?? new Set();
    return !requiredDocTypes.every((docType) => docsForShipment.has(docType));
  });

  const documentCompleteness =
    deliveredShipments.length > 0
      ? ((deliveredShipments.length - incompleteShipments.length) / deliveredShipments.length) * 100
      : 100;

  // Summary KPIs
  const totalContracts = contracts.length;
  const openDisputes = invoiceDisputes.length;
  const enabledRuleCount = alertRules.filter((rule) => rule.enabled).length;
  const unreadAlerts = alerts.filter((alert) => !alert.read).length;
  const overdueInvoices = invoices.filter((invoice) => {
    if (!invoice.due_date) return false;
    if (invoice.status === "paid" || invoice.approval_status === "approved") return false;
    return true;
  }).length;
  const overallCompliancePercent = slaBreaches.length > 0
    ? ((slaBreaches.length - breachingCount) / slaBreaches.length) * 100
    : 100;
  const regulatoryChecks = [
    {
      label: "SLA Adherence",
      note: `${breachingCount} carrier breach${breachingCount === 1 ? "" : "es"} detected`,
      status: breachingCount === 0 ? "pass" : "fail",
    },
    {
      label: "Documentation Completeness",
      note: `${formatPercent(documentCompleteness)} of delivered shipments have required docs`,
      status: documentCompleteness >= 95 ? "pass" : documentCompleteness >= 85 ? "warning" : "fail",
    },
    {
      label: "Dispute Resolution",
      note: `${openDisputes} open dispute${openDisputes === 1 ? "" : "s"} awaiting finance action`,
      status: openDisputes <= 2 ? "pass" : openDisputes <= 5 ? "warning" : "fail",
    },
    {
      label: "Payment Timeliness",
      note: `${overdueInvoices} overdue invoice${overdueInvoices === 1 ? "" : "s"} not yet settled`,
      status: overdueInvoices === 0 ? "pass" : overdueInvoices <= 3 ? "warning" : "fail",
    },
    {
      label: "Alert Governance",
      note: `${enabledRuleCount} enabled rules, ${unreadAlerts} unread alert${unreadAlerts === 1 ? "" : "s"}`,
      status: enabledRuleCount === 0 || unreadAlerts > 0 ? "warning" : "pass",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#1d4ed8_55%,#0f766e_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Compliance & Monitoring
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          SLA performance and document completeness
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50">
          Monitor carrier SLA compliance, track documentation completeness, and manage open
          disputes for {company?.name}.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Contracts",
            value: String(totalContracts),
            note: "Active carrier agreements",
          },
          {
            label: "SLA Breaches",
            value: String(breachingCount),
            note: `Out of ${totalContracts} contracts`,
          },
          {
            label: "Open Disputes",
            value: String(openDisputes),
            note: "Invoice-level disputes requiring resolution",
          },
          {
            label: "Unread Alerts",
            value: String(unreadAlerts),
            note: "Compliance and SLA events not acknowledged",
          },
          {
            label: "Overall Compliance",
            value: formatPercent(overallCompliancePercent),
            note: "Carriers meeting SLA targets",
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

      <section className="space-y-6 xl:grid xl:grid-cols-[1.1fr_0.9fr] xl:gap-6 xl:space-y-0">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            SLA Compliance
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Carrier performance vs. contract targets
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-4 py-3">Carrier</th>
                  <th className="px-4 py-3">SLA Target</th>
                  <th className="px-4 py-3">Actual</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {slaBreaches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-500">
                      No SLA data available.
                    </td>
                  </tr>
                ) : (
                  slaBreaches.map((breach) => (
                    <tr key={breach.contractId} className="border-t border-slate-200/70 text-sm text-slate-700">
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {breach.carrierName}
                      </td>
                      <td className="px-4 py-4">{formatPercent(breach.slaPercent)}</td>
                      <td className="px-4 py-4">{formatPercent(breach.actualRate)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            breach.isBreaching
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {breach.isBreaching ? "Breaching" : "Compliant"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Document Status
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600 mb-2">
                  <span>Delivered Shipments</span>
                  <span className="font-semibold text-slate-950">{deliveredShipments.length}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600 mb-2">
                  <span>Complete Documents</span>
                  <span className="font-semibold text-slate-950">
                    {deliveredShipments.length - incompleteShipments.length}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600 mb-2">
                  <span>Missing Documents</span>
                  <span className="font-semibold text-slate-950">{incompleteShipments.length}</span>
                </div>
              </div>

              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Completeness Rate
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {formatPercent(documentCompleteness)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Active Disputes
            </p>
            <div className="mt-5 space-y-2">
              {openDisputes === 0 ? (
                <p className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No open disputes.
                </p>
              ) : (
                <div className="rounded-[1.2rem] bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-900">
                    {openDisputes} dispute{openDisputes !== 1 ? "s" : ""} require action
                  </p>
                  <p className="mt-2 text-xs text-rose-700">
                    Review and resolve disputes to maintain compliance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Regulatory & Policy Checkpoints
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {regulatoryChecks.map((check) => (
            <article
              key={check.label}
              className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900">{check.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    check.status === "pass"
                      ? "bg-emerald-100 text-emerald-700"
                      : check.status === "warning"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {check.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{check.note}</p>
            </article>
          ))}
        </div>
      </section>

      {incompleteShipments.length > 0 && (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Shipments Missing Documentation
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-4 py-3">Tracking Number</th>
                  <th className="px-4 py-3">Delivered</th>
                  <th className="px-4 py-3">Missing Documents</th>
                </tr>
              </thead>
              <tbody>
                {incompleteShipments.map((shipment) => {
                  const docs = documentsByShipment.get(shipment.id) ?? new Set();
                  const missing = requiredDocTypes.filter((dt) => !docs.has(dt));

                  return (
                    <tr key={shipment.id} className="border-t border-slate-200/70 text-slate-700">
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {shipment.tracking_number}
                      </td>
                      <td className="px-4 py-4 text-xs">{formatDate(shipment.created_at)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {missing.map((dt) => dt.replace(/_/g, " ")).join(", ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
