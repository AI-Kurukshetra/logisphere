import {
  captureDeliveryProofAction,
  createFieldUpdateAction,
  reportDamageAction,
} from "@/app/(workspace)/field-ops/actions";
import { MobileInstallBanner } from "@/app/_components/mobile-install-banner";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function FieldOpsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("tracking.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [shipmentsRes, trackingEventsRes, documentsRes, alertsRes] = await Promise.all([
    supabase
      .from("shipments")
      .select("id, tracking_number, status, shipped_at, delivered_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("tracking_events")
      .select("id, shipment_id, status, description, event_at")
      .eq("company_id", company!.id)
      .order("event_at", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, title, document_type, entity_id, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("alerts")
      .select("id, title, type, message, created_at, read")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const shipments = shipmentsRes.data ?? [];
  const trackingEvents = trackingEventsRes.data ?? [];
  const documents = documentsRes.data ?? [];
  const alerts = alertsRes.data ?? [];

  return (
    <div className="min-h-screen space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_52%,#16a34a_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime-200 sm:text-sm">
          📍 Field Operations
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl lg:text-4xl">
          Delivery updates, POD capture, and damage workflows
        </h1>
        <p className="mt-4 max-w-2xl text-xs leading-6 text-blue-50 sm:text-sm">
          Give drivers and carrier operators a single place to update shipment status, submit POD
          records, and escalate damage exceptions.
        </p>
      </section>

      {error ? (
        <div className="mx-auto max-w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:px-6 lg:px-8">
          <p className="text-xs sm:text-sm">{error}</p>
        </div>
      ) : null}
      {message ? (
        <div className="mx-auto max-w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:px-6 lg:px-8">
          <p className="text-xs sm:text-sm">{message}</p>
        </div>
      ) : null}
      <MobileInstallBanner />

      {/* Forms Section */}
      <section className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <form
          action={createFieldUpdateAction}
          className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
            📝 Field Update
          </p>
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
            <select
              name="shipmentId"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              required
            >
              <option value="">Select shipment</option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.tracking_number}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              required
            >
              {["picked_up", "in_transit", "out_for_delivery", "delivered", "exception"].map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                )
              )}
            </select>
            <textarea
              name="notes"
              placeholder="Arrived at customer dock"
              className="w-full min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:min-h-24 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            />
            <div className="grid gap-2 grid-cols-2 sm:gap-4">
              <input
                name="city"
                placeholder="Chicago"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              />
              <input
                name="country"
                placeholder="United States"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              />
            </div>
            <button className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-5 sm:py-3 sm:text-sm">
              Save Update
            </button>
          </div>
        </form>

        <form
          action={captureDeliveryProofAction}
          className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
            📸 Capture POD
          </p>
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
            <select
              name="shipmentId"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              required
            >
              <option value="">Select shipment</option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.tracking_number}
                </option>
              ))}
            </select>
            <input
              name="signerName"
              placeholder="Customer receiver"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              required
            />
            <input
              name="storagePath"
              placeholder="pod/2026/ship-001.jpg"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            />
            <textarea
              name="notes"
              placeholder="Delivered at rear gate"
              className="w-full min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:min-h-24 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            />
            <button className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-5 sm:py-3 sm:text-sm">
              Capture POD
            </button>
          </div>
        </form>

        <form
          action={reportDamageAction}
          className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
            ⚠️ Damage Report
          </p>
          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
            <select
              name="shipmentId"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              required
            >
              <option value="">Select shipment</option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.tracking_number}
                </option>
              ))}
            </select>
            <select
              name="severity"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            >
              {["medium", "high", "critical"].map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
            <textarea
              name="notes"
              placeholder="Pallet corner crushed on arrival"
              className="w-full min-h-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none transition focus:border-slate-900 focus:bg-white sm:min-h-24 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            />
            <button className="w-full rounded-full bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-500 sm:px-5 sm:py-3 sm:text-sm">
              Report Damage
            </button>
          </div>
        </form>
      </section>

      {/* Data Section */}
      <section className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:col-span-2 sm:rounded-[2rem] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
            📋 Recent Events
          </p>
          <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
            {trackingEvents.length > 0 ? (
              trackingEvents.map((event) => {
                const shipment = shipments.find((item) => item.id === event.shipment_id);
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 sm:rounded-[1.4rem] sm:p-4"
                  >
                    <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                      {shipment?.tracking_number || event.shipment_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                      {event.status} • {event.description || "No notes"}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center sm:rounded-[1.4rem] sm:p-4">
                <p className="text-xs text-slate-500 sm:text-sm">No recent events</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
              📄 Delivery Documents
            </p>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto sm:mt-5 sm:space-y-3">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 sm:rounded-[1.4rem] sm:p-4"
                  >
                    <p className="text-xs font-semibold text-slate-900 sm:text-sm">{document.title}</p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                      {document.document_type} • {document.entity_id}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center sm:rounded-[1.4rem] sm:p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">No documents</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.3em]">
              🔔 Active Alerts
            </p>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto sm:mt-5 sm:space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border-2 p-3 sm:rounded-[1.4rem] sm:p-4 ${
                      alert.read
                        ? "border-slate-200/80 bg-slate-50"
                        : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">{alert.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center sm:rounded-[1.4rem] sm:p-4">
                  <p className="text-xs text-slate-500 sm:text-sm">No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
