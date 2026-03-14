import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { supplyChainManagerRoutes } from "@/manager_directory/routes";

/**
 * Logistics Manager hub — supply_chain_manager and users with tracking.manage
 * see the full Logistics Manager Dashboard on /dashboard. This route
 * redirects there for a single entry point (Dashboard shows the logistics
 * view when profile.role === "supply_chain_manager").
 */
export default async function LogisticsPage() {
  await requirePermission("tracking.manage");
  redirect(supplyChainManagerRoutes.dashboard);
}
