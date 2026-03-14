import Link from "next/link";
import {
  acknowledgeAlertAction,
  openInvoiceDisputeAction,
  resolveInvoiceDisputeAction,
} from "@/app/(workspace)/exceptions/actions";
import { buildExceptionAlerts } from "@/lib/logistics-exceptions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function titleize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "No update";
  const parsed = new Date(value);
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
  return Number.isNaN(parsed.getTime()) ? "No update" : formatter.format(parsed);
}

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return "";
  const record = metadata as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : "";
}

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("audit.read");
  const companyId = company!.id;
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [shipmentsRes, invoicesRes, trackingEventsRes, carriersRes, disputesRes, alertsRes] =
    await Promise.all([
      supabase
        .from("shipments")
        .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("invoices")
        .select("id, invoice_number, shipment_id, status, approval_status")
        .eq("company_id", companyId)
        .limit(200),
      supabase
        .from("tracking_events")
        .select("shipment_id, event_at")
        .eq("company_id", companyId)
        .order("event_at", { ascending: false })
        .limit(200),
      supabase.from("carriers").select("id, name"),
      supabase
        .from("invoice_disputes")
        .select("id, invoice_id, status, notes, created_at, resolved_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("alerts")
        .select("id, title, type, message, read, metadata, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const shipments = shipmentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const trackingEvents = trackingEventsRes.data ?? [];
  const carriers = carriersRes.data ?? [];
  const disputes = disputesRes.data ?? [];
  const alertsFeed = alertsRes.data ?? [];

  const alerts = buildExceptionAlerts(shipments, invoices, trackingEvents, carriers);
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const highCount = alerts.filter((alert) => alert.severity === "high").length;
  const openDisputes = disputes.filter((dispute) => dispute.status === "open");
  const invoicesNeedingDisputes = invoices.filter((invoice) => {
    const hasOpenDispute = openDisputes.some((dispute) => dispute.invoice_id === invoice.id);
    return ["exception", "disputed"].includes(invoice.status) && !hasOpenDispute;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#07213d_0%,#0f3d63_55%,#0b7285_100%)] p-6 text-white shadow-[0_20px_50px_rgba(7,24,46,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Exception Management
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Delivery, billing, and dispute workflows
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50">
          Detect operational exceptions, acknowledge alerts, and push invoice issues into a formal
          dispute resolution queue.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            Open Alerts: {alerts.length}
          </span>
          <span className="rounded-full border border-rose-200/30 bg-rose-500/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            Critical: {criticalCount}
          </span>
          <span className="rounded-full border border-amber-200/30 bg-amber-500/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            High: {highCount}
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            Open Disputes: {openDisputes.length}
          </span>
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-950">Operational exception board</h2>
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
        >
          Back to Dashboard
        </Link>
      </div>

      <section className="space-y-4">
        {alerts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            <p className="font-semibold">No exceptions right now</p>
            <p className="mt-2 text-sm">
              Delivery and billing exceptions will appear here when detected. Use Tracking and
              Invoices to manage shipments and audit results.
            </p>
            <Link
              href="/tracking"
              className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Go to Tracking
            </Link>
          </div>
        ) : (
          alerts.map((alert) => {
            const linkedAlert = alertsFeed.find(
              (item) =>
                getMetadataString(item.metadata, "shipment_id") === alert.shipmentId &&
                !item.read
            );

            return (
              <article
                key={alert.shipmentId}
                className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          alert.severity === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : alert.severity === "high"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-cyan-100 text-cyan-700"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        {alert.category}
                      </span>
                      {linkedAlert ? (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                          unread alert
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">
                      {alert.trackingNumber} · {alert.carrier}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Recommended: {alert.recommendedAction}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Detected {formatDateTime(alert.detectedAt)} · Shipment status:{" "}
                      {titleize(alert.source.shipmentStatus)}
                      {alert.source.invoiceStatus
                        ? ` · Invoice: ${titleize(alert.source.invoiceStatus)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/tracking?shipment=${alert.shipmentId}`}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                    >
                      View shipment
                    </Link>
                    <Link
                      href="/invoices"
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
                    >
                      Review invoices
                    </Link>
                    {linkedAlert ? (
                      <form action={acknowledgeAlertAction}>
                        <input type="hidden" name="alertId" value={linkedAlert.id} />
                        <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                          Acknowledge
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Open Disputes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Claims and finance exception workflow
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {openDisputes.length} open
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {openDisputes.length === 0 ? (
              <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No open disputes at the moment.
              </p>
            ) : (
              openDisputes.map((dispute) => {
                const invoice = invoices.find((item) => item.id === dispute.invoice_id);
                return (
                  <article key={dispute.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {invoice?.invoice_number || dispute.invoice_id}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Status {invoice?.status || "unknown"} · Created {formatDateTime(dispute.created_at)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {dispute.notes || "No dispute notes captured."}
                        </p>
                      </div>
                      <form action={resolveInvoiceDisputeAction}>
                        <input type="hidden" name="disputeId" value={dispute.id} />
                        <input type="hidden" name="invoiceId" value={dispute.invoice_id} />
                        <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                          Resolve
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Finance Exceptions Awaiting Dispute
          </p>
          <div className="mt-5 space-y-3">
            {invoicesNeedingDisputes.length === 0 ? (
              <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Every exception invoice is already in a dispute workflow.
              </p>
            ) : (
              invoicesNeedingDisputes.map((invoice) => (
                <article key={invoice.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {invoice.status} · shipment {invoice.shipment_id || "unlinked"}
                      </p>
                    </div>
                    <form action={openInvoiceDisputeAction} className="grid gap-2">
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <input
                        name="notes"
                        placeholder="Notes for carrier dispute"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-900"
                      />
                      <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                        Open Dispute
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
