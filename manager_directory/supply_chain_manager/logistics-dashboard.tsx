import Link from "next/link";
import { getRoleLabel } from "@/lib/roles";
import { supplyChainManagerRoutes } from "@/manager_directory/routes";
import { SAMPLE_SHIPMENT_EXCEPTION_ALERT } from "@/types/logistics";

type CarrierRow = {
  id: string;
  name: string;
  status: string;
};

type ContractRow = {
  carrier_id: string;
  effective_from: string;
  effective_to: string | null;
  id: string;
  name: string | null;
};

type FacilityRow = {
  id: string;
  name: string;
};

type InvoiceRow = {
  amount: number | string;
  approval_status: string | null;
  carrier_id: string;
  created_at: string;
  due_date: string | null;
  id: string;
  invoice_number: string;
  shipment_id: string | null;
  status: string;
};

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  id: string;
  role: string;
};

type RegionRow = {
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

type MetricCard = {
  label: string;
  note: string;
  tone: string;
  value: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});
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

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
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

function titleize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function LogisticsManagerDashboard({
  carriers,
  companyName,
  contracts,
  exceptionAlerts,
  facilities,
  invoices,
  predictiveSignals,
  profile,
  rateShopRows,
  regions,
  shipments,
  shipmentTrend,
  statusDistribution,
  teamRows,
  trackingEvents,
  carrierScores,
}: {
  carriers: CarrierRow[];
  companyName: string;
  contracts: ContractRow[];
  exceptionAlerts: ShipmentExceptionAlert[];
  facilities: FacilityRow[];
  invoices: InvoiceRow[];
  predictiveSignals: Array<{
    carrier: string;
    confidence: number;
    reasons: string[];
    risk: number;
    shipmentId: string;
    trackingNumber: string;
  }>;
  profile: {
    email: string | null;
    full_name: string | null;
    role: string;
  };
  rateShopRows: Array<{
    activeContract: string;
    carrierId: string;
    carrierName: string;
    currency: string;
    delta: number;
    effectiveFrom: string | null;
    rateAmount: number | null;
    recommendation: string;
    status: string;
  }>;
  regions: RegionRow[];
  shipments: ShipmentRow[];
  shipmentTrend: Array<{ count: number; key: string; label: string }>;
  statusDistribution: Array<{ count: number; label: string; percentage: number; tone: string }>;
  teamRows: ProfileRow[];
  trackingEvents: TrackingEventRow[];
  carrierScores: Array<{
    activity: number;
    billingAccuracy: number;
    metricSource: string;
    name: string;
    onTime: number;
    overall: number;
  }>;
}) {
  const activeShipments = shipments.filter((shipment) => shipment.status !== "delivered").length;
  const deliveryExceptions = shipments.filter((shipment) => shipment.status === "exception").length;
  const invoiceExceptions = invoices.filter((invoice) =>
    ["exception", "disputed"].includes(invoice.status)
  ).length;
  const bestRate = rateShopRows[0];
  const latestTrackingFeed = trackingEvents.slice(0, 6).map((event) => {
    const shipment = shipments.find((item) => item.id === event.shipment_id);
    const locationLabel =
      event.location?.city || event.location?.country
        ? [event.location?.city, event.location?.country].filter(Boolean).join(", ")
        : "Network update";

    return {
      description: event.description || titleize(event.status),
      locationLabel,
      status: event.status,
      trackingNumber: shipment?.tracking_number || "Shipment",
      updatedAt: event.event_at,
    };
  });

  const cards: MetricCard[] = [
    {
      label: "Live Shipments",
      note: `${statusDistribution.find((item) => item.label === "In Transit")?.count ?? 0} currently moving across carrier networks.`,
      tone: "bg-cyan-500",
      value: formatCount(activeShipments),
    },
    {
      label: "Best Rate Available",
      note: bestRate ? `${bestRate.carrierName} is currently the lowest quoted carrier.` : "Add rates to activate rate shopping insights.",
      tone: "bg-emerald-500",
      value: bestRate?.rateAmount != null ? formatCurrency(bestRate.rateAmount) : "$0",
    },
    {
      label: "Exceptions",
      note: `${deliveryExceptions} delivery issues and ${invoiceExceptions} billing issues require review.`,
      tone: "bg-rose-500",
      value: formatCount(exceptionAlerts.length),
    },
    {
      label: "Predictive Risk",
      note: `${predictiveSignals.length} shipments are flagged by the predictive model heuristics.`,
      tone: "bg-amber-500",
      value: predictiveSignals[0] ? `${predictiveSignals[0].risk}%` : "0%",
    },
    {
      label: "Carrier Coverage",
      note: `${carriers.filter((carrier) => carrier.status === "active").length} active carriers and ${contracts.length} contracts in scope.`,
      tone: "bg-indigo-500",
      value: `${formatCount(carriers.length)} carriers`,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#07213d_0%,#0f3d63_55%,#0b7285_100%)] p-6 text-white shadow-[0_20px_50px_rgba(7,24,46,0.18)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
                Supply Chain Manager Directory
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                Multi-carrier command center for {companyName}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50">
                Designed for {getRoleLabel(profile.role)}. Real-time shipment tracking, rate
                shopping, exception management, and predictive risk signals.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={supplyChainManagerRoutes.tracking}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                New Shipment
              </Link>
              <Link
                href={supplyChainManagerRoutes.exceptions}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Alerts
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Regions</p>
              <p className="mt-2 text-2xl font-semibold">{formatCount(regions.length)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Facilities</p>
              <p className="mt-2 text-2xl font-semibold">{formatCount(facilities.length)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Active Carriers</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCount(carriers.filter((carrier) => carrier.status === "active").length)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Contracts</p>
              <p className="mt-2 text-2xl font-semibold">{formatCount(contracts.length)}</p>
            </div>
          </div>
        </div>

        {(exceptionAlerts.length > 0 || predictiveSignals.length > 0) && (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                  Action Required
                </p>
                <h3 className="mt-2 text-xl font-semibold text-amber-950">
                  {exceptionAlerts.length} exceptions and {predictiveSignals.length} risks need
                  attention
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  Review delivery issues, billing disputes, and predictive risk flags to prevent
                  operational disruptions.
                </p>
              </div>
              <Link
                href={supplyChainManagerRoutes.exceptions}
                className="shrink-0 whitespace-nowrap rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Review Now
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950">
                  {card.value}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg ${card.tone} opacity-10`} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Real-time Shipment Tracking
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Multi-carrier movement board ({formatCount(activeShipments)} active)
              </h3>
            </div>
            <Link
              href={supplyChainManagerRoutes.tracking}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              View All
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCount(item.count)}
                      </p>
                      <p className="text-xs text-slate-500">{item.percentage}%</p>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.tone}`}
                      style={{ width: `${Math.max(item.percentage, item.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-6">
              {shipmentTrend.map((bucket) => {
                const maxCount = Math.max(...shipmentTrend.map((item) => item.count), 1);
                return (
                  <div key={bucket.key} className="flex flex-col rounded-[1.3rem] bg-slate-50 p-3">
                    <div className="flex h-36 items-end rounded-xl bg-white px-2 py-3">
                      <div
                        className="w-full rounded-t-lg bg-[linear-gradient(180deg,#0ea5e9_0%,#0f766e_100%)]"
                        style={{
                          height: `${Math.max(
                            (bucket.count / maxCount) * 100,
                            bucket.count > 0 ? 10 : 0
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{bucket.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                      {formatCount(bucket.count)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {latestTrackingFeed.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                No tracking events yet. As shipment events stream into Supabase, this board becomes
                the live carrier timeline.
              </div>
            ) : (
              latestTrackingFeed.map((item) => (
                <div
                  key={`${item.trackingNumber}-${item.updatedAt}`}
                  className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.trackingNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {item.locationLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {titleize(item.status)}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.updatedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Rate Shopping Engine
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Best rate:{" "}
                  {bestRate?.rateAmount != null ? formatCurrency(bestRate.rateAmount) : "—"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {bestRate?.carrierName || "No rates available"}
                </p>
              </div>
              <Link
                href={supplyChainManagerRoutes.rates}
                className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Manage Rates
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {rateShopRows.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                  No rate rows are available yet. Add carrier rates and contracts to enable
                  best-rate selection.
                </div>
              ) : (
                rateShopRows.slice(0, 5).map((row, index) => (
                  <div
                    key={row.carrierId}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{row.carrierName}</p>
                        <p className="mt-1 text-sm text-slate-600">{row.activeContract}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          Effective {formatDate(row.effectiveFrom)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {row.rateAmount != null ? formatCurrency(row.rateAmount) : "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {index === 0 ? "baseline" : `${row.delta}% above best`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {row.recommendation}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {titleize(row.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  AI-Powered Predictive Analytics
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Delay and overrun risk model
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {predictiveSignals.length} shipment
                  {predictiveSignals.length !== 1 ? "s" : ""} flagged for review
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {predictiveSignals.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                  Predictive signals appear once shipments, tracking events, and invoice statuses
                  start accumulating.
                </div>
              ) : (
                predictiveSignals.map((signal) => (
                  <div
                    key={signal.shipmentId}
                    className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{signal.trackingNumber}</p>
                        <p className="mt-1 text-sm text-slate-600">{signal.carrier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                          {signal.risk}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {signal.confidence}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          signal.risk >= 75
                            ? "bg-rose-500"
                            : signal.risk >= 50
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                        }`}
                        style={{ width: `${signal.risk}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {signal.reasons.join(" • ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Exception Management
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {exceptionAlerts.length} issue{exceptionAlerts.length !== 1 ? "s" : ""} requiring
                action
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {deliveryExceptions} delivery • {invoiceExceptions} billing
              </p>
            </div>
            <Link
              href={supplyChainManagerRoutes.exceptions}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              Review
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {exceptionAlerts.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                No live exceptions are currently derived from shipments and invoices.
              </div>
            ) : (
              exceptionAlerts.map((alert) => (
                <div
                  key={alert.shipmentId}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.trackingNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">{alert.carrier}</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {alert.category}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{alert.message}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {alert.recommendedAction}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Detected {formatDateTime(alert.detectedAt)} • Shipment status:{" "}
                    {titleize(alert.source.shipmentStatus)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Carrier Performance Scorecards
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {carrierScores.length} carrier{carrierScores.length !== 1 ? "s" : ""} tracked
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                On-time delivery and service quality metrics
              </p>
            </div>
            <Link
              href={supplyChainManagerRoutes.carriers}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              View All
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {carrierScores.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                Scorecards will render once carriers and shipments are present in company scope.
              </div>
            ) : (
              carrierScores.slice(0, 5).map((carrier) => (
                <div
                  key={carrier.name}
                  className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{carrier.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{carrier.metricSource}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {carrier.overall}%
                      </p>
                      <p className="mt-1 text-xs text-slate-500">overall score</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      { label: "On-time", value: carrier.onTime, tone: "bg-cyan-500" },
                      { label: "Activity", value: carrier.activity, tone: "bg-emerald-500" },
                      { label: "Billing", value: carrier.billingAccuracy, tone: "bg-amber-500" },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                          <span>{metric.label}</span>
                          <span className="font-semibold text-slate-900">{metric.value}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${metric.tone}`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Delivery Team Snapshot
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {teamRows.length} team member{teamRows.length !== 1 ? "s" : ""}
              </h3>
            </div>
            <Link
              href={supplyChainManagerRoutes.settingsAccess}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
            >
              Manage
            </Link>
          </div>
          <div className="mt-6 grid gap-3">
            {teamRows.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                No additional team members are attached to this company yet.
              </div>
            ) : (
              teamRows.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {member.full_name || member.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            System Architecture &amp; Performance
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Dashboard capabilities &amp; real-time updates
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            WebSocket-powered live tracking with predictive insights
          </p>

          <div className="mt-6 space-y-5">
            <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                React/Vue Components
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <li>Tracking: ShipmentTrackingDashboard, ShipmentListPanel, TrackingMapView, TimelineView, RealtimeIndicator</li>
                <li>Rate shopping: RateShoppingEngine, QuoteRequestForm, RateOptionsComparison, SavingsAnalysis</li>
                <li>Exceptions: ExceptionDashboard, ExceptionCard, SeverityIndicator, AutoEscalation</li>
                <li>Scorecards: CarrierScorecardsView, ScorecardRanking, MetricBar, TrendChart</li>
                <li>Predictive: PredictiveAnalyticsDashboard, DelayPredictionPanel, RiskScoreGauge, SavingsRecommendations</li>
              </ul>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                WebSocket Requirements
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Endpoint:{" "}
                  <code className="rounded bg-slate-200 px-1.5 py-0.5">
                    wss://api.logisphere.app/ws/tracking
                  </code>
                </p>
                <p>
                  Message types: <code>tracking.update</code>, <code>shipment.created</code>,{" "}
                  <code>shipment.exception</code>, <code>heartbeat</code>
                </p>
                <p>
                  Subscribe with{" "}
                  <code>{`{ "action": "subscribe", "shipmentIds": ["id1", "id2"] }`}</code> and
                  scope updates by <code>company_id</code>.
                </p>
                <p>
                  Reconnect with exponential backoff, replay missed events from the last
                  acknowledged cursor, and surface feed health in the UI.
                </p>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-950 bg-slate-950 p-4 text-slate-100">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Sample Shipment Exception Alert
              </p>
              <pre className="mt-4 overflow-x-auto text-xs leading-6 text-cyan-100">
                {JSON.stringify(SAMPLE_SHIPMENT_EXCEPTION_ALERT, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
