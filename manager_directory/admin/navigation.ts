import { adminRoutes } from "@/manager_directory/routes";

export type AdminRouteKey =
  | "dashboard"
  | "audits"
  | "tracking"
  | "carriers"
  | "rates"
  | "payments"
  | "exceptions"
  | "reports"
  | "users"
  | "settings";

const adminNavConfig = [
  { key: "dashboard", label: "Dashboard", href: adminRoutes.dashboard, icon: "📊" },
  { key: "audits", label: "Invoice Auditing", href: adminRoutes.audits, icon: "✓" },
  { key: "tracking", label: "Shipment Tracking", href: adminRoutes.tracking, icon: "🚚" },
  { key: "carriers", label: "Carriers", href: adminRoutes.carriers, icon: "🏢" },
  { key: "rates", label: "Rates & Contracts", href: adminRoutes.rates, icon: "💰" },
  { key: "payments", label: "Payments", href: adminRoutes.payments, icon: "💳" },
  { key: "exceptions", label: "Exception Management", href: adminRoutes.exceptions, icon: "⚠️" },
  { key: "reports", label: "Reports", href: adminRoutes.reports, icon: "📈" },
  { key: "users", label: "Users & Access", href: adminRoutes.users, icon: "👥" },
  { key: "settings", label: "Settings", href: adminRoutes.settings, icon: "⚙️" },
] as const;

export function getAdminSidebarItems(active: AdminRouteKey) {
  return adminNavConfig.map((item) => ({
    ...item,
    active: item.key === active,
  }));
}
