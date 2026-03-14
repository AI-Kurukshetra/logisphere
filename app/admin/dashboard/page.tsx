import Link from "next/link";
import { getRoleLabel } from "@/lib/roles";
import { requirePlatformAdmin } from "@/lib/supabase/session";
import { AdminConsoleShell } from "@/manager_directory/admin/admin-console-shell";

const shipmentStatusOrder = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

const invoiceStatusOrder = [
  "pending",
  "approved",
  "exception",
  "paid",
  "disputed",
] as const;

const paymentStatusOrder = [
  "pending",
  "completed",
  "failed",
  "cancelled",
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type CarrierRow = {
  id: string;
  name: string;
  status: string;
};

type CompanyRow = {
  created_at: string;
  id: string;
  name: string;
  slug: string;
};

type InvoiceRow = {
  amount: number | string;
  approval_status: string | null;
  carrier_id: string;
  created_at: string;
  due_date: string | null;
  id: string;
  invoice_number: string;
  status: string;
};

type PaymentRow = {
  amount: number | string;
  created_at: string;
  id: string;
  invoice_id: string;
  paid_at: string | null;
  status: string;
};

type PerformanceMetricRow = {
  billing_accuracy: number | string | null;
  carrier_id: string;
  damage_rate: number | string | null;
  on_time_rate: number | string | null;
  period_end: string;
  period_start: string;
  score: number | string | null;
};

type ProfileRow = {
  company_id: string | null;
  created_at: string;
  email: string | null;
  full_name: string | null;
  id: string;
  role: string;
};

type ShipmentRow = {
  carrier_id: string;
  created_at: string;
  delivered_at: string | null;
  id: string;
  status: string;
};

type AuditRow = {
  created_at: string;
  id: string;
  invoice_id: string;
  result: string;
  variance_amount: number | string | null;
};

type ChartDatum = {
  color: string;
  count: number;
  label: string;
  percentage: number;
  valueLabel?: string;
};

type TrendDatum = {
  amount: number;
  count: number;
  label: string;
};

type CarrierScore = {
  activity: number;
  billingAccuracy: number;
  carrierId: string;
  metricSource: string;
  name: string;
  onTime: number;
  overall: number;
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
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function toNumber(value: number | string | null | undefined) {
  const normalized = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(normalized) ? Number(normalized) : 0;
}

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

function titleize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function groupByStatus(statuses: string[], rows: Array<{ status: string }>, colors: string[]) {
  const total = rows.length;
  return statuses.map((status, index) => {
    const count = rows.filter((row) => row.status === status).length;
    return {
      color: colors[index % colors.length],
      count,
      label: titleize(status),
      percentage: percentage(count, total),
    };
  });
}

function buildInvoiceTrend(invoices: InvoiceRow[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      amount: 0,
      count: 0,
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: monthFormatter.format(date),
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const invoice of invoices) {
    const created = new Date(invoice.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.amount += toNumber(invoice.amount);
  }

  return buckets.map(({ amount, count, label }) => ({ amount, count, label }));
}

function buildAgingBuckets(invoices: InvoiceRow[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const buckets = [
    { color: "bg-red-500", count: 0, label: "Overdue", percentage: 0, total: 0 },
    { color: "bg-amber-500", count: 0, label: "Due in 7 days", percentage: 0, total: 0 },
    { color: "bg-emerald-500", count: 0, label: "Future due", percentage: 0, total: 0 },
    { color: "bg-slate-400", count: 0, label: "No due date", percentage: 0, total: 0 },
  ];

  const openInvoices = invoices.filter((invoice) => invoice.status !== "paid");

  for (const invoice of openInvoices) {
    const amount = toNumber(invoice.amount);
    if (!invoice.due_date) {
      buckets[3].count += 1;
      buckets[3].total += amount;
      continue;
    }
    const due = new Date(invoice.due_date);
    due.setHours(0, 0, 0, 0);
    const deltaDays = Math.round((due.getTime() - startOfToday.getTime()) / 86400000);

    if (deltaDays < 0) {
      buckets[0].count += 1;
      buckets[0].total += amount;
    } else if (deltaDays <= 7) {
      buckets[1].count += 1;
      buckets[1].total += amount;
    } else {
      buckets[2].count += 1;
      buckets[2].total += amount;
    }
  }

  const totalOpen = openInvoices.length;
  return buckets.map((bucket) => ({
    ...bucket,
    percentage: percentage(bucket.count, totalOpen),
    valueLabel: formatCurrency(bucket.total),
  }));
}

function buildCarrierScores(
  carriers: CarrierRow[],
  shipments: ShipmentRow[],
  invoices: InvoiceRow[],
  performanceMetrics: PerformanceMetricRow[]
) {
  const latestMetricByCarrier = new Map<string, PerformanceMetricRow>();

  for (const metric of performanceMetrics) {
    if (!latestMetricByCarrier.has(metric.carrier_id)) {
      latestMetricByCarrier.set(metric.carrier_id, metric);
    }
  }

  return carriers
    .map((carrier) => {
      const latestMetric = latestMetricByCarrier.get(carrier.id);

      if (latestMetric) {
        const onTime = Math.round(toNumber(latestMetric.on_time_rate));
        const billingAccuracy = Math.round(toNumber(latestMetric.billing_accuracy));
        const overall = Math.round(toNumber(latestMetric.score));
        const damageRate = toNumber(latestMetric.damage_rate);
        return {
          activity: Math.max(0, Math.round(100 - damageRate)),
          billingAccuracy,
          carrierId: carrier.id,
          metricSource: `${formatDate(latestMetric.period_start)} to ${formatDate(latestMetric.period_end)}`,
          name: carrier.name,
          onTime,
          overall,
        };
      }

      const carrierShipments = shipments.filter((shipment) => shipment.carrier_id === carrier.id);
      const carrierInvoices = invoices.filter((invoice) => invoice.carrier_id === carrier.id);
      const delivered = carrierShipments.filter((shipment) => shipment.status === "delivered").length;
      const healthyShipments = carrierShipments.filter((shipment) => shipment.status !== "exception").length;
      const cleanInvoices = carrierInvoices.filter(
        (invoice) => !["exception", "disputed"].includes(invoice.status)
      ).length;
      const onTime = carrierShipments.length ? percentage(delivered, carrierShipments.length) : 0;
      const activity = carrierShipments.length ? percentage(healthyShipments, carrierShipments.length) : 0;
      const billingAccuracy = carrierInvoices.length ? percentage(cleanInvoices, carrierInvoices.length) : 0;
      const overall = Math.round((onTime + activity + billingAccuracy) / 3);

      return {
        activity,
        billingAccuracy,
        carrierId: carrier.id,
        metricSource:
          carrierShipments.length || carrierInvoices.length ? "Derived from live shipment and invoice rows" : "No performance rows yet",
        name: carrier.name,
        onTime,
        overall,
      };
    })
    .sort((left, right) => right.overall - left.overall)
    .slice(0, 5);
}

function DistributionPanel({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: ChartDatum[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-gray-900">{title}</h2>
      <div className="space-y-4">
        {items.every((item) => item.count === 0) ? (
          <p className="text-sm text-gray-500">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatCount(item.count)}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.max(item.percentage, item.count > 0 ? 6 : 0)}%` }}
                />
              </div>
              {item.valueLabel ? <p className="mt-1 text-xs text-gray-500">{item.valueLabel}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TrendPanel({
  data,
  title,
}: {
  data: TrendDatum[];
  title: string;
}) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">Invoice rows created in the visible Supabase scope.</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Direct DB read
        </div>
      </div>
      {data.every((item) => item.count === 0) ? (
        <p className="text-sm text-gray-500">No invoice rows yet, so trend bars will populate after the first billing cycle lands in Supabase.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-6">
          {data.map((item) => (
            <div key={item.label} className="flex flex-col rounded-lg bg-gray-50 p-3">
              <div className="flex h-40 items-end justify-center rounded-md bg-white px-3 py-4">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                  style={{ height: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 12 : 0)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCount(item.count)}</p>
              <p className="mt-1 text-xs text-gray-500">{formatCurrency(item.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CarrierPanel({
  carriers,
}: {
  carriers: CarrierScore[];
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-gray-900">Carrier Scorecards</h2>
      <div className="space-y-4">
        {carriers.length === 0 ? (
          <p className="text-sm text-gray-500">No carrier rows are visible yet. Add carriers or performance metric rows to populate this scorecard.</p>
        ) : (
          carriers.map((carrier) => (
            <div key={carrier.carrierId} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{carrier.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{carrier.metricSource}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{carrier.overall}%</p>
                  <p className="text-xs text-gray-500">overall</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  { label: "On-time", value: carrier.onTime, tone: "bg-blue-500" },
                  { label: "Activity", value: carrier.activity, tone: "bg-emerald-500" },
                  { label: "Billing", value: carrier.billingAccuracy, tone: "bg-amber-500" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-700">
                      <span>{metric.label}</span>
                      <span className="font-semibold text-gray-900">{metric.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className={`h-full rounded-full ${metric.tone}`} style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: "Admin Dashboard",
  description: "Logisphere Freight Intelligence Platform - Admin Control Center",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const { company, profile, supabase } = await requirePlatformAdmin();
  const companyId = profile?.company_id ?? null;
  const scopeLabel = companyId ? `${company?.name ?? "Company"} scope` : "Visible admin scope";

  const [shipmentsRes, invoicesRes, carriersRes, performanceMetricsRes, profilesRes, companiesRes] =
    await Promise.all([
      companyId
        ? supabase
            .from("shipments")
            .select("id, carrier_id, status, created_at, delivered_at")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
        : supabase
            .from("shipments")
            .select("id, carrier_id, status, created_at, delivered_at")
            .order("created_at", { ascending: false }),
      companyId
        ? supabase
            .from("invoices")
            .select("id, invoice_number, amount, status, approval_status, carrier_id, due_date, created_at")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
        : supabase
            .from("invoices")
            .select("id, invoice_number, amount, status, approval_status, carrier_id, due_date, created_at")
            .order("created_at", { ascending: false }),
      supabase.from("carriers").select("id, name, status").order("name"),
      companyId
        ? supabase
            .from("performance_metrics")
            .select(
              "carrier_id, on_time_rate, damage_rate, billing_accuracy, score, period_start, period_end"
            )
            .eq("company_id", companyId)
            .order("period_end", { ascending: false })
        : supabase
            .from("performance_metrics")
            .select(
              "carrier_id, on_time_rate, damage_rate, billing_accuracy, score, period_start, period_end"
            )
            .order("period_end", { ascending: false }),
      companyId
        ? supabase
            .from("profiles")
            .select("id, full_name, email, role, company_id, created_at")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false })
            .limit(6)
        : supabase
            .from("profiles")
            .select("id, full_name, email, role, company_id, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
      companyId
        ? supabase
            .from("companies")
            .select("id, name, slug, created_at")
            .eq("id", companyId)
            .order("created_at", { ascending: false })
            .limit(6)
        : supabase
            .from("companies")
            .select("id, name, slug, created_at")
            .order("created_at", { ascending: false })
            .limit(6),
    ]);

  const shipments = (shipmentsRes.data ?? []) as ShipmentRow[];
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
  const carriers = (carriersRes.data ?? []) as CarrierRow[];
  const performanceMetrics = (performanceMetricsRes.data ?? []) as PerformanceMetricRow[];
  const visibleProfiles = (profilesRes.data ?? []) as ProfileRow[];
  const visibleCompanies = (companiesRes.data ?? []) as CompanyRow[];

  const visibleInvoiceIds = invoices.map((invoice) => invoice.id);

  const [auditsRes, paymentsRes] = await Promise.all(
    visibleInvoiceIds.length
      ? [
          supabase
            .from("audits")
            .select("id, invoice_id, result, variance_amount, created_at")
            .in("invoice_id", visibleInvoiceIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("payments")
            .select("id, invoice_id, amount, status, paid_at, created_at")
            .in("invoice_id", visibleInvoiceIds)
            .order("created_at", { ascending: false }),
        ]
      : [
          Promise.resolve({ data: [] as AuditRow[] }),
          Promise.resolve({ data: [] as PaymentRow[] }),
        ]
  );

  const audits = (auditsRes.data ?? []) as AuditRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  const activeCarriers = carriers.filter((carrier) => carrier.status === "active").length;
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
  const exceptionExposure = invoices
    .filter((invoice) => ["exception", "disputed"].includes(invoice.status))
    .reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
  const completedPaymentAmount = payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const pendingApprovalCount = invoices.filter(
    (invoice) => invoice.status === "pending" || invoice.approval_status === "pending_approval"
  ).length;
  const recentExceptions = invoices
    .filter((invoice) => ["exception", "disputed"].includes(invoice.status))
    .slice(0, 5)
    .map((invoice) => ({
      amount: formatCurrency(toNumber(invoice.amount)),
      carrier: carriers.find((carrier) => carrier.id === invoice.carrier_id)?.name ?? "Unknown carrier",
      dueDate: formatDate(invoice.due_date),
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: titleize(invoice.status),
    }));
  const invoiceTrend = buildInvoiceTrend(invoices);
  const invoiceStatusData = groupByStatus(invoiceStatusOrder as unknown as string[], invoices, [
    "bg-slate-500",
    "bg-emerald-500",
    "bg-red-500",
    "bg-blue-500",
    "bg-amber-500",
  ]);
  const shipmentStatusData = groupByStatus(shipmentStatusOrder as unknown as string[], shipments, [
    "bg-slate-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-red-500",
  ]);
  const paymentStatusData = groupByStatus(paymentStatusOrder as unknown as string[], payments, [
    "bg-amber-500",
    "bg-emerald-500",
    "bg-red-500",
    "bg-slate-500",
  ]);
  const agingData = buildAgingBuckets(invoices);
  const carrierScores = buildCarrierScores(carriers, shipments, invoices, performanceMetrics);
  const recentVariance = audits
    .filter((audit) => toNumber(audit.variance_amount) > 0)
    .slice(0, 1)
    .at(0);
  const liveCards = [
    {
      label: "Visible Shipments",
      note: `${shipmentStatusData.find((item) => item.label === "Delivered")?.count ?? 0} delivered`,
      value: formatCount(shipments.length),
    },
    {
      label: "Visible Invoices",
      note: `${formatCurrency(totalInvoiceAmount)} billed`,
      value: formatCount(invoices.length),
    },
    {
      label: "Exception Exposure",
      note: `${formatCount(recentExceptions.length)} recent exceptions`,
      value: formatCurrency(exceptionExposure),
    },
    {
      label: "Completed Payments",
      note: `${paymentStatusData.find((item) => item.label === "Completed")?.count ?? 0} records`,
      value: formatCurrency(completedPaymentAmount),
    },
    {
      label: "Carrier Network",
      note: `${activeCarriers} active of ${carriers.length}`,
      value: formatCount(carriers.length),
    },
    {
      label: "Admin Visibility",
      note: `${visibleCompanies.length} workspaces, ${visibleProfiles.length} users`,
      value: scopeLabel,
    },
  ];

  return (
    <AdminConsoleShell active="dashboard">
      <div className="p-6 sm:p-8">
          {error ? (
            <p className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <div
            className="mb-8 rounded-2xl border border-gray-300 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#38bdf8_100%)] p-6 text-white shadow-sm"
            style={{ animation: "fadeIn 0.5s ease-out both" }}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">Live Supabase Overview</p>
                <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Freight Intelligence Dashboard</h1>
                <p className="mt-3 text-sm leading-6 text-blue-50">
                  This view now reads shipment, invoice, audit, payment, carrier, company, and profile detail directly from Supabase on the server.
                  Scope: {scopeLabel}. Refreshed {formatDate(new Date().toISOString())}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Pending Approval</p>
                  <p className="mt-2 text-2xl font-bold">{formatCount(pendingApprovalCount)}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Audit Rows</p>
                  <p className="mt-2 text-2xl font-bold">{formatCount(audits.length)}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Latest Variance</p>
                  <p className="mt-2 text-2xl font-bold">
                    {recentVariance ? formatCurrency(toNumber(recentVariance.variance_amount)) : "$0"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {liveCards.map((card, index) => (
              <div
                key={card.label}
                className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm"
                style={{ animation: `fadeIn 0.5s ease-out ${index * 0.08}s both` }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-2 text-sm text-gray-500">{card.note}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <TrendPanel data={invoiceTrend} title="Six-Month Invoice Trend" />
            <DistributionPanel
              title="Invoice Status Mix"
              items={invoiceStatusData}
              emptyLabel="No invoice rows are visible yet."
            />
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <DistributionPanel
              title="Shipment Status"
              items={shipmentStatusData}
              emptyLabel="No shipment rows are visible yet."
            />
            <DistributionPanel
              title="Open Invoice Aging"
              items={agingData}
              emptyLabel="There are no open invoices in the current Supabase scope."
            />
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <CarrierPanel carriers={carrierScores} />
            <div className="space-y-6">
              <DistributionPanel
                title="Payment Status"
                items={paymentStatusData}
                emptyLabel="No payment rows are visible yet."
              />

              <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { href: companyId ? "/admin/audits?compose=invoice" : "/admin/settings?compose=bootstrap", label: "New Invoice" },
                    { href: companyId ? "/admin/tracking?compose=shipment" : "/admin/settings?compose=bootstrap", label: "Track Shipments" },
                    { href: "/admin/exceptions", label: "Inspect Exceptions" },
                    { href: companyId ? "/admin/payments?compose=payment" : "/admin/settings?compose=bootstrap", label: "Process Payments" },
                    { href: "/admin/users", label: "Manage Users" },
                    { href: companyId ? "/admin/reports?compose=report" : "/admin/settings?compose=bootstrap", label: "Open Reports" },
                  ].map((action) => (
                    <Link
                      key={`${action.label}-${action.href}`}
                      href={action.href}
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-300 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Exceptions</h2>
                <p className="mt-1 text-sm text-gray-500">Invoice rows pulled directly from Supabase with exception or disputed states.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-300 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Carrier</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Due</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExceptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                          No exception invoices are visible yet.
                        </td>
                      </tr>
                    ) : (
                      recentExceptions.map((exception) => (
                        <tr key={exception.id} className="border-b border-gray-200 last:border-b-0">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{exception.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{exception.carrier}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{exception.amount}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{exception.dueDate}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              {exception.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-300 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Users And Workspaces</h2>
                <p className="mt-1 text-sm text-gray-500">Visible profile and company rows from the current admin session.</p>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Users</p>
                  <div className="space-y-3">
                    {visibleProfiles.length === 0 ? (
                      <p className="text-sm text-gray-500">No profile rows are visible.</p>
                    ) : (
                      visibleProfiles.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                          <p className="text-sm font-semibold text-gray-900">{entry.full_name || entry.email || "Unnamed user"}</p>
                          <p className="mt-1 text-xs text-gray-500">{entry.email || "No email"} • {getRoleLabel(entry.role)}</p>
                          <p className="mt-1 text-xs text-gray-500">Created {formatDate(entry.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Workspaces</p>
                  <div className="space-y-3">
                    {visibleCompanies.length === 0 ? (
                      <p className="text-sm text-gray-500">No company rows are visible. This matches the current database state if onboarding has not attached a workspace yet.</p>
                    ) : (
                      visibleCompanies.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                          <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                          <p className="mt-1 text-xs text-gray-500">/{entry.slug}</p>
                          <p className="mt-1 text-xs text-gray-500">Created {formatDate(entry.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            <p className="font-semibold">Supabase status snapshot</p>
            <p className="mt-1">
              {formatCount(shipments.length + invoices.length + audits.length + payments.length + carriers.length)} visible operational rows across shipments,
              invoices, audits, payments, and carriers. Empty charts reflect the current database contents, not placeholder data.
            </p>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
