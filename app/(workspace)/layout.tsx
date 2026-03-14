import { buildExceptionAlerts } from "@/lib/logistics-exceptions";
import { WorkspaceProfileMenu } from "@/app/_components/workspace-profile-menu";
import {
  WorkspaceSidebar,
  type WorkspaceSidebarSection,
  type WorkspaceSidebarStat,
} from "@/app/_components/workspace-sidebar";
import { getRoleLabel, normalizeUserRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/supabase/session";
import {
  billingManagerRoutes,
  driversCarriersRoutes,
  supplyChainManagerRoutes,
  workspaceRoutes,
} from "@/manager_directory/routes";

type NavItem = {
  description?: string;
  href: string;
  label: string;
};

const baseRoadmapItems: NavItem[] = [
  { href: workspaceRoutes.dashboard, label: "Dashboard" },
  { href: workspaceRoutes.analytics, label: "Analytics" },
  { href: workspaceRoutes.exceptions, label: "Exceptions" },
  { href: workspaceRoutes.scorecards, label: "Scorecards" },
  { href: workspaceRoutes.reports, label: "Reports" },
  { href: workspaceRoutes.spendAnalysis, label: "Spend Analysis" },
  { href: workspaceRoutes.integrations, label: "Integrations" },
  { href: workspaceRoutes.fieldOps, label: "Field Ops" },
  { href: workspaceRoutes.logistics, label: "Logistics Manager" },
  { href: workspaceRoutes.intelligence, label: "Intelligence" },
  { href: workspaceRoutes.compliance, label: "Compliance" },
  { href: workspaceRoutes.settingsOrganization, label: "Organization" },
  { href: workspaceRoutes.settingsAccess, label: "Access Control" },
  { href: workspaceRoutes.settingsAlerts, label: "Alert Rules" },
  { href: workspaceRoutes.settingsAudit, label: "Audit Trail" },
  { href: workspaceRoutes.settingsProfile, label: "Profile" },
  { href: workspaceRoutes.imports, label: "Imports" },
  { href: workspaceRoutes.documents, label: "Documents" },
  { href: workspaceRoutes.carriers, label: "Carriers" },
  { href: workspaceRoutes.rates, label: "Rates" },
  { href: workspaceRoutes.tracking, label: "Tracking" },
  { href: workspaceRoutes.invoices, label: "Invoices" },
  { href: workspaceRoutes.payments, label: "Payments" },
];

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { company, permissions, profile, supabase, user } = await requireWorkspace();
  const role = normalizeUserRole(profile?.role) ?? profile?.role;
  const companyId = company?.id ?? profile?.company_id ?? null;

  const roleSpecificItems: NavItem[] =
    role === "billing_manager"
      ? [
          { href: billingManagerRoutes.dashboard, label: "Billing Dashboard" },
          { href: workspaceRoutes.invoices, label: "Invoices" },
          { href: workspaceRoutes.payments, label: "Payments" },
          { href: workspaceRoutes.exceptions, label: "Exceptions" },
          { href: workspaceRoutes.reports, label: "Reports" },
          { href: workspaceRoutes.scorecards, label: "Scorecards" },
          { href: workspaceRoutes.documents, label: "Documents" },
          { href: workspaceRoutes.settingsAccess, label: "Access & Roles" },
          { href: workspaceRoutes.settingsProfile, label: "Profile" },
        ]
      : role === "supply_chain_manager"
        ? [
            { href: supplyChainManagerRoutes.dashboard, label: "Logistics Dashboard" },
            { href: workspaceRoutes.tracking, label: "Tracking" },
            { href: workspaceRoutes.exceptions, label: "Exceptions" },
            { href: workspaceRoutes.rates, label: "Rates" },
            { href: workspaceRoutes.carriers, label: "Carriers" },
            { href: workspaceRoutes.analytics, label: "Analytics" },
            { href: workspaceRoutes.spendAnalysis, label: "Spend Analysis" },
            { href: workspaceRoutes.scorecards, label: "Scorecards" },
            { href: workspaceRoutes.reports, label: "Reports" },
            { href: workspaceRoutes.documents, label: "Documents" },
            { href: workspaceRoutes.integrations, label: "Integrations" },
            { href: workspaceRoutes.settingsOrganization, label: "Organization" },
            { href: workspaceRoutes.settingsAccess, label: "Access Control" },
            { href: workspaceRoutes.settingsAudit, label: "Audit Trail" },
            { href: workspaceRoutes.settingsProfile, label: "Profile" },
          ]
        : role === "drivers_carriers"
          ? [
              {
                href: driversCarriersRoutes.dashboard,
                label: "Driver Dashboard",
                description: "Live queue, proof backlog, and shift priorities.",
              },
              {
                href: workspaceRoutes.fieldOps,
                label: "Field Ops",
                description: "Post delivery updates, capture proof, report damage.",
              },
              {
                href: workspaceRoutes.tracking,
                label: "Tracking",
                description: "Update timeline events and shipment movement.",
              },
              {
                href: workspaceRoutes.exceptions,
                label: "Exceptions",
                description: "Resolve delayed, damaged, and billing-linked issues.",
              },
              {
                href: workspaceRoutes.documents,
                label: "Documents",
                description: "Register POD files and operational artifacts.",
              },
              { href: workspaceRoutes.settingsProfile, label: "Profile" },
            ]
          : baseRoadmapItems;

  const navItems = roleSpecificItems.filter((item) => {
    if (item.href === workspaceRoutes.settingsAccess) {
      return permissions.includes("roles.manage");
    }
    if (item.href === workspaceRoutes.settingsOrganization) {
      return permissions.includes("regions.manage");
    }
    if (item.href === workspaceRoutes.settingsAlerts) {
      return permissions.includes("alerts.manage");
    }
    if (item.href === workspaceRoutes.settingsAudit) {
      return permissions.includes("audit.read");
    }
    if (item.href === workspaceRoutes.compliance) {
      return permissions.includes("audit.read");
    }
    if (item.href === workspaceRoutes.imports) {
      return permissions.includes("imports.manage");
    }
    if (item.href === workspaceRoutes.documents) {
      return permissions.includes("documents.manage");
    }
    if (item.href === workspaceRoutes.carriers) {
      return permissions.includes("carriers.manage");
    }
    if (item.href === workspaceRoutes.intelligence) {
      return (
        permissions.includes("payments.manage") ||
        permissions.includes("rates.manage")
      );
    }
    if (
      item.href === workspaceRoutes.analytics ||
      item.href === workspaceRoutes.exceptions ||
      item.href === workspaceRoutes.reports ||
      item.href === workspaceRoutes.scorecards ||
      item.href === workspaceRoutes.spendAnalysis
    ) {
      return permissions.includes("audit.read");
    }
    if (item.href === workspaceRoutes.integrations) {
      return permissions.includes("imports.manage");
    }
    if (item.href === workspaceRoutes.rates) {
      return permissions.includes("rates.manage");
    }
    if (item.href === workspaceRoutes.tracking) {
      return permissions.includes("tracking.manage");
    }
    if (item.href === workspaceRoutes.fieldOps || item.href === workspaceRoutes.logistics) {
      return permissions.includes("tracking.manage");
    }
    if (item.href === workspaceRoutes.invoices) {
      return permissions.includes("invoices.manage");
    }
    if (item.href === workspaceRoutes.payments) {
      return permissions.includes("payments.manage");
    }
    return true;
  });

  let sidebarStats: WorkspaceSidebarStat[] = [];
  let sidebarSections: WorkspaceSidebarSection[] = [
    {
      title: "Workspace",
      items: navItems.map((item) => ({
        ...item,
        badge: null,
      })),
    },
  ];
  let sidebarEyebrow = "Workspace";
  let sidebarFooterNote =
    "Navigation and content in this workspace are scoped to the current company through Supabase-backed permissions and tenant-aware queries.";

  if (role === "billing_manager" && companyId) {
    sidebarEyebrow = "Billing Manager";
    sidebarFooterNote =
      "Finance modules in this workspace are scoped to company invoices, payments, documents, and audit activity through Supabase-backed permissions.";

    const invoicesRes = await supabase
      .from("invoices")
      .select("id, status, due_date")
      .eq("company_id", companyId);
    const invoices = (invoicesRes.data ?? []) as Array<{
      id: string;
      status: string;
      due_date: string | null;
    }>;
    const now = new Date().toISOString().slice(0, 10);
    const pendingInvoices = invoices.filter((inv) =>
      ["pending", "approved"].includes(inv.status)
    ).length;
    const openDisputes = invoices.filter((inv) =>
      ["exception", "disputed"].includes(inv.status)
    ).length;
    const overdue = invoices.filter(
      (inv) => inv.due_date && inv.due_date < now && inv.status !== "paid"
    ).length;

    sidebarStats = [
      {
        label: "Pending Invoices",
        value: String(pendingInvoices),
        note: "Awaiting approval or payment.",
      },
      {
        label: "Open Disputes",
        value: String(openDisputes),
        note: "Exception or disputed invoices to resolve.",
      },
      {
        label: "Overdue",
        value: String(overdue),
        note: "Past due date, not yet paid.",
      },
    ];

    sidebarSections = [
      {
        title: "Billing",
        items: navItems
          .filter((item) => item.href !== workspaceRoutes.settingsProfile)
          .map((item) => ({
            ...item,
            badge:
              item.href === workspaceRoutes.invoices
                ? pendingInvoices
                : item.href === workspaceRoutes.exceptions
                  ? openDisputes
                  : null,
          })),
      },
      {
        title: "Account",
        items: navItems
          .filter((item) => item.href === workspaceRoutes.settingsProfile)
          .map((item) => ({ ...item, badge: null })),
      },
    ];
  } else if (role === "supply_chain_manager") {
    sidebarEyebrow = "Logistics Manager";
    sidebarFooterNote =
      "Logistics views in this workspace are scoped to tenant shipments, carriers, rates, tracking events, and exception monitoring.";
    sidebarSections = [
      {
        title: "Logistics",
        items: navItems
          .filter((item) => item.href !== workspaceRoutes.settingsProfile)
          .map((item) => ({ ...item, badge: null })),
      },
      {
        title: "Account",
        items: navItems
          .filter((item) => item.href === workspaceRoutes.settingsProfile)
          .map((item) => ({ ...item, badge: null })),
      },
    ];
  } else if (role === "drivers_carriers" && companyId) {
    sidebarEyebrow = "Driver Workspace";
    sidebarFooterNote =
      "Driver modules in this panel use live company-scoped data from shipments, tracking events, documents, alerts, and invoice-linked exception signals.";

    const [shipmentsRes, trackingEventsRes, carriersRes, documentsRes, invoicesRes] =
      await Promise.all([
        supabase
          .from("shipments")
          .select("id, carrier_id, tracking_number, status, shipped_at, delivered_at, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(120),
        supabase
          .from("tracking_events")
          .select("id, shipment_id, status, description, event_at")
          .eq("company_id", companyId)
          .order("event_at", { ascending: false })
          .limit(120),
        supabase.from("carriers").select("id, name"),
        supabase
          .from("documents")
          .select("id, document_type")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(120),
        supabase
          .from("invoices")
          .select("shipment_id, status")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(120),
      ]);

    const shipments = shipmentsRes.data ?? [];
    const trackingEvents = trackingEventsRes.data ?? [];
    const documents = documentsRes.data ?? [];
    const invoices = invoicesRes.data ?? [];
    const carriers = carriersRes.data ?? [];

    const activeLoads = shipments.filter((shipment) =>
      ["created", "picked_up", "in_transit", "out_for_delivery"].includes(shipment.status)
    ).length;
    const deliveredLoads = shipments.filter(
      (shipment) => shipment.status === "delivered"
    ).length;
    const proofDocuments = documents.filter((document) =>
      ["proof_of_delivery", "pod", "delivery_note", "invoice_attachment"].includes(
        document.document_type
      )
    ).length;
    const exceptionAlerts = buildExceptionAlerts(
      shipments,
      invoices,
      trackingEvents.map((event) => ({
        event_at: event.event_at,
        shipment_id: event.shipment_id,
      })),
      carriers
    );
    const podGap = Math.max(0, deliveredLoads - proofDocuments);

    const badgeByRoute = new Map<string, number>([
      [driversCarriersRoutes.dashboard, activeLoads],
      [workspaceRoutes.fieldOps, podGap],
      [workspaceRoutes.tracking, activeLoads],
      [workspaceRoutes.exceptions, exceptionAlerts.length],
      [workspaceRoutes.documents, documents.length],
    ]);

    sidebarStats = [
      {
        label: "Active Loads",
        value: String(activeLoads),
        note: "Shipments still moving through pickup, transit, or delivery.",
      },
      {
        label: "Open Issues",
        value: String(exceptionAlerts.length),
        note: "Operational or billing-linked exceptions requiring attention.",
      },
      {
        label: "POD Gap",
        value: String(podGap),
        note: "Delivered loads still missing proof or delivery artifacts.",
      },
    ];

    sidebarSections = [
      {
        title: "Operations",
        items: navItems
          .filter((item) => item.href !== workspaceRoutes.settingsProfile)
          .map((item) => ({
            ...item,
            badge: badgeByRoute.get(item.href) ?? null,
          })),
      },
      {
        title: "Account",
        items: navItems
          .filter((item) => item.href === workspaceRoutes.settingsProfile)
          .map((item) => ({
            ...item,
            badge: null,
          })),
      },
    ];
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/50 bg-[rgba(255,251,246,0.8)] shadow-[0_20px_80px_rgba(74,58,34,0.12)] backdrop-blur lg:grid-cols-[280px_1fr]">
        <WorkspaceSidebar
          companyName={company?.name || "Workspace"}
          companySlug={company?.slug ?? null}
          eyebrow={sidebarEyebrow}
          email={profile?.email || user.email || null}
          footerNote={sidebarFooterNote}
          fullName={profile?.full_name ?? null}
          roleLabel={getRoleLabel(role)}
          sections={sidebarSections}
          stats={sidebarStats}
        />

        <div className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-4 border-b border-[color:var(--border)] px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {role === "billing_manager"
                  ? "Billing Manager"
                  : role === "drivers_carriers"
                    ? "Driver Workspace"
                    : role === "supply_chain_manager"
                      ? "Logistics"
                      : "Tenant"}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {company?.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Scope: {company?.slug ?? "—"} · Account: {profile?.email || user.email || "—"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <WorkspaceProfileMenu
                avatarUrl={profile?.avatar_url ?? null}
                email={profile?.email || user.email || null}
                fullName={profile?.full_name ?? null}
                role={profile?.role}
              />
            </div>
          </header>

          <div className="flex-1 px-6 py-6 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
