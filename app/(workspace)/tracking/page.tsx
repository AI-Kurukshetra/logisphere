import {
  createShipmentAction,
  createTrackingEventAction,
} from "@/app/(workspace)/tracking/actions";
import { RealtimeTracker } from "@/app/(workspace)/tracking/realtime-tracker";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function titleize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
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

function getShipmentTone(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "exception") return "bg-rose-100 text-rose-700";
  if (status === "out_for_delivery") return "bg-amber-100 text-amber-700";
  if (status === "in_transit" || status === "picked_up") {
    return "bg-cyan-100 text-cyan-700";
  }
  return "bg-slate-100 text-slate-700";
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("tracking.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [carriers, facilities, shipments, trackingEvents] = await Promise.all([
    supabase.from("carriers").select("id, name").order("name"),
    supabase.from("facilities").select("id, name, code").eq("company_id", company!.id),
    supabase
      .from("shipments")
      .select("id, carrier_id, tracking_number, origin_facility_id, dest_facility_id, status, shipped_at, delivered_at, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("tracking_events")
      .select("id, shipment_id, status, description, event_at, location")
      .eq("company_id", company!.id)
      .order("event_at", { ascending: false })
      .limit(40),
  ]);

  const shipmentRows = shipments.data ?? [];
  const eventRows = trackingEvents.data ?? [];
  const carrierRows = carriers.data ?? [];
  const facilityRows = facilities.data ?? [];

  const activeShipments = shipmentRows.filter((shipment) =>
    ["created", "picked_up", "in_transit", "out_for_delivery"].includes(shipment.status)
  );
  const deliveredShipments = shipmentRows.filter(
    (shipment) => shipment.status === "delivered"
  );
  const exceptionShipments = shipmentRows.filter(
    (shipment) => shipment.status === "exception"
  );

  const shipmentCards = shipmentRows.map((shipment) => {
    const carrier = carrierRows.find((item) => item.id === shipment.carrier_id);
    const originFacility = facilityRows.find(
      (item) => item.id === shipment.origin_facility_id
    );
    const destFacility = facilityRows.find(
      (item) => item.id === shipment.dest_facility_id
    );
    const latestEvent = eventRows.find((event) => event.shipment_id === shipment.id);

    return {
      carrierName: carrier?.name || "Carrier",
      destinationName: destFacility?.name || "Destination pending",
      eventSummary: latestEvent?.description || titleize(latestEvent?.status || shipment.status),
      latestEventAt: latestEvent?.event_at || shipment.shipped_at || shipment.created_at,
      originName: originFacility?.name || "Origin pending",
      status: shipment.status,
      trackingNumber: shipment.tracking_number,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0f766e_100%)] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-100">
              Tracking Operations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              Shipment visibility and timeline control
            </h1>
            <p className="mt-4 text-sm leading-7 text-cyan-50/90 sm:text-base">
              Create new loads, post status events, and monitor the live shipment board for{" "}
              {company?.name}. This screen is optimized for day-to-day dispatch and operations use.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Active", value: String(activeShipments.length) },
              { label: "Delivered", value: String(deliveredShipments.length) },
              { label: "Exceptions", value: String(exceptionShipments.length) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.4rem] border border-white/12 bg-white/10 px-4 py-4 text-center backdrop-blur-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
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

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <form
          action={createShipmentAction}
          className="rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Create Shipment
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Register a new load
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start tracking with carrier, lane, and departure details.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Dispatch
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Carrier</label>
              <select
                name="carrierId"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              >
                <option value="">Select carrier</option>
                {carrierRows.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Tracking Number</label>
              <input
                name="trackingNumber"
                placeholder="LGS-2026-1005"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Origin Facility</label>
                <select
                  name="originFacilityId"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                >
                  <option value="">Select origin</option>
                  {facilityRows.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Destination Facility</label>
                <select
                  name="destFacilityId"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                >
                  <option value="">Select destination</option>
                  {facilityRows.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Shipped At</label>
              <input
                name="shippedAt"
                type="datetime-local"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <button className="mt-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Create Shipment
            </button>
          </div>
        </form>

        <form
          action={createTrackingEventAction}
          className="rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Post Event
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Update the shipment timeline
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Record live status changes and the latest field note.
              </p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Live Feed
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Shipment</label>
              <select
                name="shipmentId"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              >
                <option value="">Select shipment</option>
                {shipmentRows.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.tracking_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                name="status"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              >
                {[
                  "created",
                  "picked_up",
                  "in_transit",
                  "out_for_delivery",
                  "delivered",
                  "exception",
                ].map((status) => (
                  <option key={status} value={status}>
                    {titleize(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                placeholder="Trailer arrived at regional hub and is awaiting unload."
                className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">City</label>
                <input
                  name="city"
                  placeholder="Chicago"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Country</label>
                <input
                  name="country"
                  placeholder="United States"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <button className="mt-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Add Tracking Event
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.8rem] border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Shipment Board
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Current shipment visibility
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {shipmentCards.length} rows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-6 py-4">Tracking</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Carrier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Latest Update</th>
                </tr>
              </thead>
              <tbody>
                {shipmentCards.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No shipments in scope yet.
                    </td>
                  </tr>
                ) : (
                  shipmentCards.map((shipment) => (
                    <tr
                      key={shipment.trackingNumber}
                      className="border-t border-slate-200/70 text-sm text-slate-700"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-950">
                          {shipment.trackingNumber}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p>{shipment.originName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          to {shipment.destinationName}
                        </p>
                      </td>
                      <td className="px-6 py-4">{shipment.carrierName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getShipmentTone(
                            shipment.status
                          )}`}
                        >
                          {titleize(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p>{shipment.eventSummary}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(shipment.latestEventAt)}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Status Summary
            </p>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Created", count: shipmentRows.filter((s) => s.status === "created").length },
                { label: "In Transit", count: shipmentRows.filter((s) => s.status === "in_transit").length },
                { label: "Out for Delivery", count: shipmentRows.filter((s) => s.status === "out_for_delivery").length },
                { label: "Delivered", count: deliveredShipments.length },
                { label: "Exceptions", count: exceptionShipments.length },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[1.2rem] bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <RealtimeTracker
            companyId={company!.id}
            initialEvents={eventRows}
            initialShipments={shipmentRows}
          />
        </div>
      </section>
    </div>
  );
}
