import type { UserRole } from "@/types/database";

/** Signup-only roles (no admin). */
export const SIGNUP_ROLES = [
  {
    id: "billing_manager" as const,
    label: "Billing Manager",
    scope: "Finance — Audit & Payment",
    description: "Invoice auditing, payments, approval workflows",
    icon: "💰",
  },
  {
    id: "supply_chain_manager" as const,
    label: "Supply Chain Manager",
    scope: "Logistics — Visibility & Routing",
    description: "Shipment tracking, carrier management, visibility",
    icon: "📦",
  },
  {
    id: "drivers_carriers" as const,
    label: "Drivers & Carriers",
    scope: "Carrier/Field — Execution & Compliance",
    description: "Execution, compliance, POD and tracking updates",
    icon: "🚚",
  },
] as const;

/** All assignable roles (includes admin for access settings). */
export const ALL_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "billing_manager", label: "Billing Manager (Finance)" },
  { value: "supply_chain_manager", label: "Supply Chain Manager (Logistics)" },
  { value: "drivers_carriers", label: "Drivers & Carriers (Carrier/Field)" },
  { value: "manager", label: "Manager" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
  billing_manager: "Billing Manager",
  supply_chain_manager: "Supply Chain Manager",
  drivers_carriers: "Drivers & Carriers",
};

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "admin",
  manager: "manager",
  viewer: "viewer",
  billing_manager: "billing_manager",
  "billing manager": "billing_manager",
  "billing-manager": "billing_manager",
  finance_manager: "billing_manager",
  "finance manager": "billing_manager",
  "finance-manager": "billing_manager",
  supply_chain_manager: "supply_chain_manager",
  "supply chain manager": "supply_chain_manager",
  "supply-chain-manager": "supply_chain_manager",
  logistics_manager: "supply_chain_manager",
  "logistics manager": "supply_chain_manager",
  "logistics-manager": "supply_chain_manager",
  drivers_carriers: "drivers_carriers",
  "drivers carriers": "drivers_carriers",
  "drivers-carriers": "drivers_carriers",
  "drivers & carriers": "drivers_carriers",
  driver: "drivers_carriers",
  carrier: "drivers_carriers",
};

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const normalized = role.trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? null;
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "";
  const normalizedRole = normalizeUserRole(role);
  return normalizedRole ? ROLE_LABELS[normalizedRole] : role;
}
