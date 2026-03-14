import { cache } from "react";
import { redirect } from "next/navigation";
import { normalizeUserRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type AccountProfile = {
  avatar_url: string | null;
  business_unit_id: string | null;
  company_id: string | null;
  email: string | null;
  facility_id: string | null;
  full_name: string | null;
  id: string;
  job_title: string | null;
  region_id: string | null;
  role: UserRole;
};

export type AccountCompany = {
  id: string;
  name: string;
  settings: unknown;
  slug: string;
};

export const getCurrentAccount = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      company: null,
      permissions: [] as string[],
      profile: null,
      supabase,
      user: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, company_id, role, job_title, region_id, business_unit_id, facility_id"
    )
    .eq("id", user.id)
    .maybeSingle();
  const normalizedRole = normalizeUserRole(profile?.role);

  const rolePermissions = normalizedRole
    ? await supabase
        .from("role_permissions")
        .select("permission_key")
        .eq("role", normalizedRole)
    : { data: [] as Array<{ permission_key: string }> };

  const company =
    profile?.company_id != null
      ? (
          await supabase
            .from("companies")
            .select("id, name, slug, settings")
            .eq("id", profile.company_id)
            .maybeSingle()
        ).data
      : null;

  return {
    company: (company as AccountCompany | null) ?? null,
    permissions: (rolePermissions.data ?? []).map((item) => item.permission_key),
    profile: profile
      ? ({
          ...profile,
          role: normalizedRole ?? profile.role,
        } as AccountProfile)
      : null,
    supabase,
    user,
  };
});

export async function requireUser() {
  const account = await getCurrentAccount();

  if (!account.user) {
    redirect("/auth");
  }

  return account;
}

export async function requireWorkspace() {
  const account = await requireUser();

  if (!account.profile?.company_id) {
    redirect("/onboarding");
  }

  return account;
}

export async function requirePermission(permissionKey: string) {
  const account = await requireWorkspace();

  if (!account.permissions.includes(permissionKey)) {
    redirect("/dashboard");
  }

  return account;
}

export async function requireCompanyAdmin() {
  return requirePermission("roles.manage");
}

export async function requirePlatformAdmin() {
  const account = await requireUser();

  const isPlatformAdmin =
    account.profile?.role === "admin" ||
    account.user.app_metadata?.platform_role === "admin";

  if (!isPlatformAdmin) {
    redirect("/admin/login?error=Admin access required.");
  }

  return account;
}

export async function redirectIfAuthenticated() {
  const account = await getCurrentAccount();

  if (!account.user) {
    return;
  }
  redirect("/dashboard");
}

export async function getAuthRedirectPath() {
  const account = await getCurrentAccount();

  if (!account.user) {
    return "/auth";
  }
  return "/dashboard";
}
