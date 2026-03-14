import Link from "next/link";
import { buildExceptionAlerts } from "@/lib/logistics-exceptions";
import { getRoleLabel, normalizeUserRole } from "@/lib/roles";
import { requireUser } from "@/lib/supabase/session";
import { FinanceManagerDashboard } from "@/manager_directory/billing_manager/finance-dashboard";
import { FieldOperationsDashboard } from "@/manager_directory/drivers_carriers/field-operations-dashboard";
import { LogisticsManagerDashboard } from "@/manager_directory/supply_chain_manager/logistics-dashboard";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type ShipmentRow = {
  carrier_id: string;
  created_at: string;
  delivered_at: string | null;
  id: string;
  shipped_at: string | null;
  status: string;
  tracking_number: string;
};

type CarrierRow = {
  id: string;
  name: string;
  status: string;
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

type RateRow = {
  carrier_id: string;
  contract_id: string | null;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  id: string;
  rate_amount: number | string;
};

type ContractRow = {
  carrier_id: string;
  effective_from: string;
  effective_to: string | null;
  id: string;
  name: string | null;
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

type PaymentRow = {
  amount: number | string;
  created_at: string;
  id: string;
  invoice_id: string;
  method: string | null;
  paid_at: string | null;
  reference: string | null;
  status: string;
};

type AuditRow = {
  created_at: string;
  id: string;
  invoice_id: string;
  result: string;
  rule_name: string | null;
  variance_amount: number | string | null;
};

type DocumentRow = {
  created_at: string;
  document_type: string;
  entity_type: string | null;
  id: string;
  title: string;
};

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  id: string;
  role: string;
};

type FacilityRow = {
  id: string;
  name: string;
};

type RegionRow = {
  id: string;
  name: string;
};

const shipmentStatusOrder = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function WorkspaceScopeNote({ role }: { role: string | null | undefined }) {
  const normalized = normalizeUserRole(role) ?? role;
  const message =
    normalized === "billing_manager"
      ? "Finance modules in this workspace are scoped to company invoices, payments, documents, and audit activity through Supabase-backed permissions."
      : normalized === "supply_chain_manager"
        ? "Logistics views in this workspace are scoped to tenant shipments, carriers, rates, tracking events, and exception monitoring."
        : normalized === "drivers_carriers"
          ? "Driver modules in this panel use live company-scoped data from shipments, tracking events, documents, alerts, and invoice-linked exception signals."
          : "Navigation and content in this workspace are scoped to the current company through Supabase-backed permissions and tenant-aware queries.";
  return (
    <section className="mt-10 rounded-[2rem] border border-slate-200/80 bg-slate-50 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
        Supabase Scope
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}

async function getCount(
  supabase: SupabaseClient,
  table:
    | "activity_logs"
    | "business_units"
    | "carriers"
    | "facilities"
    | "invoices"
    | "profiles"
    | "regions"
    | "shipments",
  companyId: string | null
) {
  const tablesWithCompany = [
    "activity_logs",
    "business_units",
    "facilities",
    "invoices",
    "profiles",
    "regions",
    "shipments",
  ];
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (companyId && tablesWithCompany.includes(table)) {
    query = query.eq("company_id", companyId);
  }
  const { count } = await query;
  return count ?? 0;
}

function toNumber(value: number | string | null | undefined) {
  const normalized = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(normalized) ? Number(normalized) : 0;
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

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function daysBetween(dateString: string | null, fallbackFrom: string) {
  const base = dateString ? new Date(dateString) : new Date(fallbackFrom);
  if (Number.isNaN(base.getTime())) return 0;
  return Math.floor((Date.now() - base.getTime()) / 86400000);
}

function buildShipmentStatusDistribution(shipments: ShipmentRow[]) {
  return shipmentStatusOrder.map((status) => {
    const count = shipments.filter((shipment) => shipment.status === status).length;
    return {
      count,
      label: titleize(status),
      percentage: percentage(count, shipments.length),
      tone:
        status === "delivered"
          ? "bg-emerald-500"
          : status === "exception"
            ? "bg-rose-500"
            : status === "in_transit"
              ? "bg-cyan-500"
              : "bg-slate-500",
    };
  });
}

function buildShipmentTrend(shipments: ShipmentRow[]) {
  const now = new Date();
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      count: 0,
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: monthFormatter.format(date),
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const shipment of shipments) {
    const created = new Date(shipment.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.count += 1;
    }
  }

  return buckets;
}

function buildRateShopRows(
  carriers: CarrierRow[],
  rates: RateRow[],
  contracts: ContractRow[]
) {
  const latestRateByCarrier = new Map<string, RateRow>();

  for (const rate of rates) {
    if (!latestRateByCarrier.has(rate.carrier_id)) {
      latestRateByCarrier.set(rate.carrier_id, rate);
    }
  }

  const rows = carriers
    .map((carrier) => {
      const latestRate = latestRateByCarrier.get(carrier.id);
      const contract = contracts.find((item) => item.carrier_id === carrier.id);
      return {
        activeContract: contract?.name || "No active contract",
        carrierId: carrier.id,
        carrierName: carrier.name,
        currency: latestRate?.currency || "USD",
        effectiveFrom: latestRate?.effective_from || null,
        rateAmount: latestRate ? toNumber(latestRate.rate_amount) : null,
        status: carrier.status,
      };
    })
    .filter((row) => row.rateAmount != null)
    .sort((left, right) => (left.rateAmount ?? 0) - (right.rateAmount ?? 0));

  const baseline = rows[0]?.rateAmount ?? 0;

  return rows.map((row, index) => {
    const delta =
      row.rateAmount == null || index === 0 || baseline <= 0
        ? 0
        : Math.max(0, Math.round(((row.rateAmount - baseline) / baseline) * 100));

    return {
      ...row,
      delta,
      recommendation:
        index === 0
          ? "Best available rate"
          : delta <= 10
            ? "Competitive backup"
            : "Escalate for optimization",
    };
  });
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
        return {
          activity: Math.max(0, Math.round(100 - toNumber(latestMetric.damage_rate))),
          billingAccuracy: Math.round(toNumber(latestMetric.billing_accuracy)),
          metricSource: `${formatDate(latestMetric.period_start)} to ${formatDate(latestMetric.period_end)}`,
          name: carrier.name,
          onTime: Math.round(toNumber(latestMetric.on_time_rate)),
          overall: Math.round(toNumber(latestMetric.score)),
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

      return {
        activity,
        billingAccuracy,
        metricSource:
          carrierShipments.length || carrierInvoices.length
            ? "Derived from live shipment and invoice data"
            : "Awaiting operational rows",
        name: carrier.name,
        onTime,
        overall: Math.round((onTime + activity + billingAccuracy) / 3),
      };
    })
    .sort((left, right) => right.overall - left.overall);
}

function buildPredictiveSignals(
  shipments: ShipmentRow[],
  invoices: InvoiceRow[],
  trackingEvents: TrackingEventRow[],
  carriers: CarrierRow[]
) {
  const latestEventByShipment = new Map<string, TrackingEventRow>();
  for (const event of trackingEvents) {
    if (!latestEventByShipment.has(event.shipment_id)) {
      latestEventByShipment.set(event.shipment_id, event);
    }
  }

  const signals = shipments
    .map((shipment) => {
      const invoice = invoices.find((item) => item.shipment_id === shipment.id);
      const latestEvent = latestEventByShipment.get(shipment.id);
      const transitDays = daysBetween(shipment.shipped_at, shipment.created_at);
      const trackingStaleDays = latestEvent ? daysBetween(latestEvent.event_at, latestEvent.event_at) : transitDays;
      const carrier = carriers.find((item) => item.id === shipment.carrier_id)?.name ?? "Carrier";

      let risk = 18;
      const reasons: string[] = [];

      if (shipment.status === "exception") {
        risk += 52;
        reasons.push("shipment already in exception");
      }
      if (shipment.status === "in_transit" && transitDays >= 4) {
        risk += 18;
        reasons.push(`in transit for ${transitDays} days`);
      }
      if (!latestEvent || trackingStaleDays >= 2) {
        risk += 12;
        reasons.push("tracking feed is stale");
      }
      if (invoice && ["exception", "disputed"].includes(invoice.status)) {
        risk += 22;
        reasons.push("linked invoice is in dispute");
      }
      if (invoice?.due_date && daysBetween(invoice.due_date, invoice.due_date) >= 0 && invoice.status !== "paid") {
        risk += 8;
        reasons.push("invoice due date has arrived");
      }

      return {
        carrier,
        confidence: Math.min(96, 62 + reasons.length * 8),
        reasons,
        risk: Math.min(99, risk),
        shipmentId: shipment.id,
        trackingNumber: shipment.tracking_number,
      };
    })
    .filter((signal) => signal.reasons.length > 0)
    .sort((left, right) => right.risk - left.risk)
    .slice(0, 5);

  return signals;
}

function StandardWorkspaceDashboard({
  companyName,
  permissions,
  profile,
  metrics,
  readiness,
  scopedFacility,
  scopedRegion,
  teammateRows,
}: {
  companyName: string;
  permissions: string[];
  profile: {
    email: string | null;
    full_name: string | null;
    role: string;
  };
  metrics: Array<{ label: string; note: string; value: number }>;
  readiness: Array<{ body: string; status: string; title: string }>;
  scopedFacility: string | null;
  scopedRegion: string | null;
  teammateRows: ProfileRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Dashboard
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            {companyName} now has access controls and org structure in place.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Sprint 1 now covers more than auth. The workspace has a company hierarchy,
            role-to-permission mapping, admin surfaces for org setup, and an audit log
            to support controlled rollout across locations.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
            Workspace Owner
          </p>
          <h3 className="mt-3 text-2xl font-semibold">{profile.full_name || profile.email}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Role: {getRoleLabel(profile.role)}. Scope: {scopedRegion || "No region"} / {scopedFacility || "No facility"}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Readiness Board
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Sprint 1 delivery status
          </h3>
          <div className="mt-6 grid gap-4">
            {readiness.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Team Snapshot
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Profiles in this company
          </h3>
          <div className="mt-6 space-y-3">
            {teammateRows.length ? (
              teammateRows.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{member.full_name || member.email}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
                Your workspace has one member so far. The access screen is ready to manage roles and scope as more company users join.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function DashboardPage() {
  const account = await requireUser();
  const { company, permissions, profile, supabase } = account;
  const role = normalizeUserRole(profile?.role) ?? profile?.role;
  const companyId = profile?.company_id;

  if (!companyId) {
    return (
      <div className="space-y-8">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Dashboard
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Your account is active. Company setup is still pending.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Signup now opens directly into the dashboard. Finish onboarding when you are ready
              to unlock tenant-scoped carriers, rates, shipments, invoices, and access controls.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Complete Workspace Setup
              </Link>
              <Link
                href="/settings/profile"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950"
              >
                Update Profile
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
              Next Step
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Create the first company workspace</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Onboarding will attach your profile to a company, promote you to admin, and create
              the initial region, business unit, and facility structure for tenant-aware operations.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Account Status",
              value: "Active",
              note: "Authentication is complete and the workspace shell is available.",
            },
            {
              label: "Company Link",
              value: "Pending",
              note: "No company has been attached to this profile yet.",
            },
            {
              label: "Recommended Action",
              value: "Onboarding",
              note: "Finish workspace setup to enable tenant-scoped modules.",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {metric.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{metric.note}</p>
            </article>
          ))}
        </section>
      </div>
    );
  }

  const [teamCount, regionCount, businessUnitCount, facilityCount, auditCount] = await Promise.all([
    getCount(supabase, "profiles", companyId),
    getCount(supabase, "regions", companyId),
    getCount(supabase, "business_units", companyId),
    getCount(supabase, "facilities", companyId),
    getCount(supabase, "activity_logs", companyId),
  ]);

  const metrics = [
    {
      label: "Workspace Members",
      value: teamCount,
      note: "Profiles currently attached to this company",
    },
    {
      label: "Regions",
      value: regionCount,
      note: "Regional structure for operational scoping",
    },
    {
      label: "Business Units",
      value: businessUnitCount,
      note: "Org segments tied to facilities and access",
    },
    {
      label: "Facilities",
      value: facilityCount,
      note: "Operational locations configured in Sprint 1",
    },
    {
      label: "Audit Entries",
      value: auditCount,
      note: "Role and hierarchy changes recorded for oversight",
    },
  ];

  const readiness = [
    {
      title: "Authentication",
      status: "Complete",
      body: "Supabase auth is active with password and magic-link entry.",
    },
    {
      title: "Role Model",
      status: "Complete",
      body: "Profiles now carry role and location scope, with permission mapping driven from Supabase tables.",
    },
    {
      title: "Organization Hierarchy",
      status: "Complete",
      body: "Regions, business units, and facilities can be created and managed from the protected settings area.",
    },
    {
      title: "Audit Trail",
      status: "Complete",
      body: "Access and hierarchy changes land in a tenant-scoped activity log for admin review.",
    },
  ];

  const [teammates, scopedRegions, scopedFacility] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").eq("company_id", companyId).limit(6),
    supabase.from("regions").select("id, name").eq("company_id", companyId).order("name"),
    supabase.from("facilities").select("id, name").eq("company_id", companyId).order("name"),
  ]);

  const teammateRows = (teammates.data ?? []) as ProfileRow[];
  const regionRows = (scopedRegions.data ?? []) as RegionRow[];
  const facilityRows = (scopedFacility.data ?? []) as FacilityRow[];

  if (role === "billing_manager") {
    const [carriersRes, invoicesRes, auditsRes, documentsRes] = await Promise.all([
      supabase.from("carriers").select("id, name, status").order("name"),
      supabase
        .from("invoices")
        .select(
          "id, carrier_id, invoice_number, amount, status, approval_status, due_date, shipment_id, created_at"
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("audits")
        .select("id, invoice_id, rule_name, result, variance_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("documents")
        .select("id, title, document_type, entity_type, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
    const invoiceIds = invoices.map((invoice) => invoice.id);
    const paymentsRes =
      invoiceIds.length > 0
        ? await supabase
            .from("payments")
            .select("id, invoice_id, amount, status, paid_at, method, reference, created_at")
            .in("invoice_id", invoiceIds)
            .order("created_at", { ascending: false })
            .limit(80)
        : { data: [] as PaymentRow[] };

    return (
      <>
        <FinanceManagerDashboard
          audits={(auditsRes.data ?? []) as AuditRow[]}
          carriers={(carriersRes.data ?? []) as CarrierRow[]}
          companyName={company?.name || "Workspace"}
          documents={(documentsRes.data ?? []) as DocumentRow[]}
          invoices={invoices}
          payments={(paymentsRes.data ?? []) as PaymentRow[]}
          profile={profile}
          teamRows={teammateRows}
        />
      </>
    );
  }

  if (role === "supply_chain_manager") {
    const [shipmentsRes, carriersRes, ratesRes, contractsRes, performanceRes, invoicesRes, trackingEventsRes] =
      await Promise.all([
        supabase
          .from("shipments")
          .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase.from("carriers").select("id, name, status").order("name"),
        supabase
          .from("rates")
          .select("id, carrier_id, contract_id, rate_amount, currency, effective_from, effective_to")
          .order("effective_from", { ascending: false })
          .limit(60),
        supabase
          .from("contracts")
          .select("id, carrier_id, name, effective_from, effective_to")
          .eq("company_id", companyId)
          .order("effective_from", { ascending: false })
          .limit(40),
        supabase
          .from("performance_metrics")
          .select("carrier_id, on_time_rate, damage_rate, billing_accuracy, score, period_start, period_end")
          .eq("company_id", companyId)
          .order("period_end", { ascending: false })
          .limit(40),
        supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, approval_status, due_date, carrier_id, shipment_id, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("tracking_events")
          .select("id, shipment_id, status, description, event_at, location")
          .eq("company_id", companyId)
          .order("event_at", { ascending: false })
          .limit(60),
      ]);

    const shipments = (shipmentsRes.data ?? []) as ShipmentRow[];
    const carriers = (carriersRes.data ?? []) as CarrierRow[];
    const rates = (ratesRes.data ?? []) as RateRow[];
    const contracts = (contractsRes.data ?? []) as ContractRow[];
    const performanceMetrics = (performanceRes.data ?? []) as PerformanceMetricRow[];
    const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
    const trackingEvents = (trackingEventsRes.data ?? []) as TrackingEventRow[];

    return (
      <>
        <LogisticsManagerDashboard
          carriers={carriers}
          companyName={company?.name || "Workspace"}
          contracts={contracts}
          exceptionAlerts={buildExceptionAlerts(shipments, invoices, trackingEvents, carriers)}
          facilities={facilityRows}
          invoices={invoices}
          predictiveSignals={buildPredictiveSignals(shipments, invoices, trackingEvents, carriers)}
          profile={profile}
          rateShopRows={buildRateShopRows(carriers, rates, contracts)}
          regions={regionRows}
          shipments={shipments}
          shipmentTrend={buildShipmentTrend(shipments)}
          statusDistribution={buildShipmentStatusDistribution(shipments)}
          teamRows={teammateRows}
          trackingEvents={trackingEvents}
          carrierScores={buildCarrierScores(carriers, shipments, invoices, performanceMetrics)}
        />
        <WorkspaceScopeNote role={profile?.role} />
      </>
    );
  }

  if (role === "drivers_carriers") {
    const [shipmentsRes, trackingEventsRes, carriersRes, documentsRes, invoicesRes] =
      await Promise.all([
        supabase
          .from("shipments")
          .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("tracking_events")
          .select("id, shipment_id, status, description, event_at, location")
          .eq("company_id", companyId)
          .order("event_at", { ascending: false })
          .limit(80),
        supabase.from("carriers").select("id, name, status").order("name"),
        supabase
          .from("documents")
          .select("id, title, document_type, entity_type, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("invoices")
          .select("id, shipment_id, status, amount, approval_status, carrier_id, invoice_number, due_date, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

    const shipments = (shipmentsRes.data ?? []) as ShipmentRow[];
    const trackingEvents = (trackingEventsRes.data ?? []) as TrackingEventRow[];
    const carriers = (carriersRes.data ?? []) as CarrierRow[];
    const invoices = (invoicesRes.data ?? []) as InvoiceRow[];

    return (
      <>
        <FieldOperationsDashboard
          carriers={carriers}
          companyName={company?.name || "Workspace"}
          documents={(documentsRes.data ?? []) as DocumentRow[]}
          exceptionAlerts={buildExceptionAlerts(shipments, invoices, trackingEvents, carriers)}
          facilities={facilityRows}
          profile={profile}
          shipments={shipments}
          trackingEvents={trackingEvents}
        />
        <WorkspaceScopeNote role={profile?.role} />
      </>
    );
  }

  return (
    <>
      <StandardWorkspaceDashboard
        companyName={company?.name || "Workspace"}
        permissions={permissions}
        profile={profile}
        metrics={metrics}
        readiness={readiness}
        scopedFacility={facilityRows[0]?.name ?? null}
        scopedRegion={regionRows[0]?.name ?? null}
        teammateRows={teammateRows}
      />
      <WorkspaceScopeNote role={profile?.role} />
    </>
  );
}
