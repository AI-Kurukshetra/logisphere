import Link from "next/link";
import { getRoleLabel } from "@/lib/roles";
import { driversCarriersRoutes } from "@/manager_directory/routes";

type CarrierRow = {
  id: string;
  name: string;
  status: string;
};

type DocumentRow = {
  created_at: string;
  document_type: string;
  entity_type: string | null;
  id: string;
  title: string;
};

type FacilityRow = {
  id: string;
  name: string;
};

type ShipmentRow = {
  carrier_id: string;
  created_at: string;
  delivered_at: string | null;
  id: string;
  shipped_at: string | null;
  status: string;
  tracking_number: string;
};

type TrackingEventRow = {
  description: string | null;
  event_at: string;
  id: string;
  location: {
    city?: string | null;
    country?: string | null;
  } | null;
  shipment_id: string;
  status: string;
};

type ShipmentExceptionAlert = import("@/lib/logistics-exceptions").ShipmentExceptionAlertUI;

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
});

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "No date" : dateFormatter.format(parsed);
}

function formatDateTime(value: string | null) {
  if (!value) return "No update";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "No update" : dateTimeFormatter.format(parsed);
}

function titleize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusTone(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (status === "exception") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (status === "out_for_delivery") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (status === "in_transit" || status === "picked_up") {
    return "bg-cyan-100 text-cyan-700 ring-cyan-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getSeverityTone(severity: string) {
  if (severity === "critical") return "bg-rose-100 text-rose-700 ring-rose-200";
  if (severity === "high") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-cyan-100 text-cyan-700 ring-cyan-200";
}

export function FieldOperationsDashboard({
  carriers,
  companyName,
  documents,
  exceptionAlerts,
  facilities,
  profile,
  shipments,
  trackingEvents,
}: {
  carriers: CarrierRow[];
  companyName: string;
  documents: DocumentRow[];
  exceptionAlerts: ShipmentExceptionAlert[];
  facilities: FacilityRow[];
  profile: {
    email: string | null;
    full_name: string | null;
    role: string;
  };
  shipments: ShipmentRow[];
  trackingEvents: TrackingEventRow[];
}) {
  const activeLoads = shipments.filter((shipment) =>
    ["created", "picked_up", "in_transit", "out_for_delivery"].includes(shipment.status)
  );
  const deliveredLoads = shipments.filter((shipment) => shipment.status === "delivered");
  const exceptionLoads = shipments.filter((shipment) => shipment.status === "exception");
  const proofDocuments = documents.filter((document) =>
    ["proof_of_delivery", "pod", "delivery_note", "invoice_attachment"].includes(
      document.document_type
    )
  );
  const urgentAlerts = exceptionAlerts.slice(0, 3);

  const latestEvents = trackingEvents.slice(0, 6).map((event) => {
    const shipment = shipments.find((item) => item.id === event.shipment_id);
    return {
      description: event.description || titleize(event.status),
      location:
        event.location?.city || event.location?.country
          ? [event.location?.city, event.location?.country].filter(Boolean).join(", ")
          : "Network update",
      status: event.status,
      trackingNumber: shipment?.tracking_number || "Shipment",
      updatedAt: event.event_at,
    };
  });

  const shiftBoard = activeLoads.slice(0, 5).map((shipment) => {
    const carrier = carriers.find((item) => item.id === shipment.carrier_id);
    const latestEvent = trackingEvents.find((event) => event.shipment_id === shipment.id);

    return {
      carrierName: carrier?.name || "Carrier",
      detail: latestEvent?.description || titleize(latestEvent?.status || shipment.status),
      lastUpdated: latestEvent?.event_at || shipment.shipped_at || shipment.created_at,
      status: shipment.status,
      trackingNumber: shipment.tracking_number,
    };
  });

  const proofBacklog = Math.max(0, deliveredLoads.length - proofDocuments.length);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_28%),linear-gradient(135deg,#081425_0%,#123d6b_46%,#0b7a59_100%)] p-6 text-white shadow-[0_24px_60px_rgba(8,20,37,0.22)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-lime-200">
              Field Execution
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em]">
              Driver control board for live loads, proof capture, and exception response
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50">
              Built for {getRoleLabel(profile.role)} at {companyName}. This view prioritizes what
              needs action now, what just changed in the field, and what must be documented before
              billing can continue.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={driversCarriersRoutes.tracking}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
              >
                Update Tracking
              </Link>
              <Link
                href={driversCarriersRoutes.documents}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Capture POD
              </Link>
              <Link
                href={driversCarriersRoutes.exceptions}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Review Exceptions
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Shift Priority</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                {formatCount(exceptionLoads.length)}
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50">
                loads currently need intervention or escalation.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Proof Backlog</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                {formatCount(proofBacklog)}
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50">
                delivered loads still waiting on proof or supporting field artifacts.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">Coverage</p>
              <p className="mt-3 text-lg font-semibold">
                {formatCount(facilities.length)} facilities • {formatCount(carriers.length)} carriers
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50">
                operating footprint currently visible in the field workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {urgentAlerts.length > 0 ? (
        <section className="rounded-[2rem] border border-rose-200 bg-[linear-gradient(180deg,#fff1f2_0%,#fff7ed_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-700">
                Immediate Attention
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                High-severity field exceptions need a quick response
              </h3>
            </div>
            <Link
              href={driversCarriersRoutes.exceptions}
              className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Open Exception Desk
            </Link>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {urgentAlerts.map((alert) => (
              <article
                key={alert.shipmentId}
                className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{alert.trackingNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">{alert.carrier}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ${getSeverityTone(alert.severity)}`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{alert.message}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            accent: "from-cyan-500 to-blue-600",
            label: "Active Loads",
            note: "Shipments currently moving through the network.",
            value: formatCount(activeLoads.length),
          },
          {
            accent: "from-emerald-500 to-green-600",
            label: "Delivered",
            note: "Completed and closed movement records.",
            value: formatCount(deliveredLoads.length),
          },
          {
            accent: "from-rose-500 to-orange-500",
            label: "Open Exceptions",
            note: "Loads that need driver or dispatcher attention.",
            value: formatCount(exceptionLoads.length),
          },
          {
            accent: "from-violet-500 to-indigo-600",
            label: "POD Records",
            note: "Delivery proof ready for downstream teams.",
            value: formatCount(proofDocuments.length),
          },
          {
            accent: "from-slate-600 to-slate-900",
            label: "Live Events",
            note: "Recent field updates captured in tracking feeds.",
            value: formatCount(trackingEvents.length),
          },
        ].map((card) => (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {card.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Shift Board
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Next loads to work
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                A tighter queue for what needs scanning, updating, delivering, or closing next.
              </p>
            </div>
            <Link
              href={driversCarriersRoutes.tracking}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Tracking
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {shiftBoard.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                No active loads are currently assigned in company scope.
              </div>
            ) : (
              shiftBoard.map((stop, index) => (
                <article
                  key={stop.trackingNumber}
                  className="grid gap-4 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:grid-cols-[auto_1fr_auto]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{stop.trackingNumber}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1 ${getStatusTone(stop.status)}`}
                      >
                        {titleize(stop.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{stop.carrierName}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{stop.detail}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last update</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDateTime(stop.lastUpdated)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Live Timeline
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Fresh field updates
                </h3>
              </div>
              <Link
                href={driversCarriersRoutes.logistics}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Ops Hub
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {latestEvents.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  Field events will appear here as soon as drivers and carrier teams start posting updates.
                </div>
              ) : (
                latestEvents.map((event) => (
                  <div
                    key={`${event.trackingNumber}-${event.updatedAt}`}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{event.trackingNumber}</p>
                        <p className="mt-1 text-sm text-slate-700">{event.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {titleize(event.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {event.location} • {formatDateTime(event.updatedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Quick Actions
            </p>
            <div className="mt-5 grid gap-3">
              {[
                {
                  body: "Log a pickup, in-transit update, or delivery event.",
                  href: driversCarriersRoutes.tracking,
                  label: "Add Tracking Event",
                },
                {
                  body: "Register proof-of-delivery and supporting field documents.",
                  href: driversCarriersRoutes.documents,
                  label: "Register POD",
                },
                {
                  body: "Escalate damaged or stalled loads before they impact customers.",
                  href: driversCarriersRoutes.exceptions,
                  label: "Escalate Issue",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 transition hover:border-slate-900"
                >
                  <p className="font-semibold text-slate-950">{action.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{action.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Exception Desk
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                What needs escalation now
              </h3>
            </div>
            <Link
              href={driversCarriersRoutes.exceptions}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              View All
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {exceptionAlerts.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                No active operational exceptions are open right now.
              </div>
            ) : (
              exceptionAlerts.slice(0, 5).map((alert) => (
                <article
                  key={alert.shipmentId}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.trackingNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{alert.carrier}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1 ${getSeverityTone(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{alert.message}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {alert.recommendedAction}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Proof of Delivery
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Recent delivery artifacts
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {formatCount(proofDocuments.length)} on file
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {proofDocuments.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                  No proof-of-delivery records have been attached yet.
                </div>
              ) : (
                proofDocuments.slice(0, 5).map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-900">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {titleize(document.document_type)} • {titleize(document.entity_type)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Added {formatDate(document.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fffef8_0%,#fff7ed_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Operator Guidance
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <p>Post status updates as soon as a shipment crosses a real operational milestone.</p>
              <p>Capture POD immediately on delivery so billing teams do not wait on field follow-up.</p>
              <p>When a load turns risky, escalate from the exception desk instead of burying it in notes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
