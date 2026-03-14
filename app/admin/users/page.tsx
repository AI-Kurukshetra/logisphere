import Link from "next/link";
import { updateAdminUserRoleAction } from "@/app/admin/actions";
import { ALL_ROLE_OPTIONS, getRoleLabel } from "@/lib/roles";
import { requirePlatformAdmin } from "@/lib/supabase/session";
import { AdminConsoleShell } from "@/manager_directory/admin/admin-console-shell";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export const metadata = {
  title: "Users & Access Control",
  description: "User management and role-based access control",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile, supabase } = await requirePlatformAdmin();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const companyId = profile?.company_id ?? null;

  const [profilesRes, activityCountRes, rolePermsRes] = await Promise.all([
    companyId
      ? supabase
          .from("profiles")
          .select("id, full_name, email, role, company_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(50)
      : supabase
          .from("profiles")
          .select("id, full_name, email, role, company_id")
          .order("created_at", { ascending: false })
          .limit(50),
    companyId
      ? supabase.from("activity_logs").select("id", { count: "exact", head: true }).eq("company_id", companyId)
      : supabase.from("activity_logs").select("id", { count: "exact", head: true }),
    supabase
      .from("role_permissions")
      .select("role")
      .then((result) => ({
        data: [...new Set((result.data ?? []).map((item) => item.role))],
      })),
  ]);

  const users = profilesRes.data ?? [];
  const totalUsers = users.length;
  const adminCount = users.filter((user) => user.role === "admin").length;
  const auditCount = typeof activityCountRes.count === "number" ? activityCountRes.count : 0;
  const rolesList = (rolePermsRes.data ?? []) as string[];

  const userStats = [
    { label: "Total Users", value: String(totalUsers), active: `${totalUsers} in scope` },
    { label: "Admin Users", value: String(adminCount), roles: `${rolesList.length} roles` },
    { label: "Roles", value: String(rolesList.length), trend: "Billing, Supply Chain, Drivers & Carriers" },
    { label: "Audit Logs", value: auditCount.toLocaleString(), period: "Company scope" },
  ];

  const roles = ALL_ROLE_OPTIONS.map((option) => ({
    label: option.label,
    name: option.value,
    permissions: option.value === "admin" ? "Full access" : option.label,
    users: users.filter((user) => user.role === option.value).length,
  }));

  return (
    <AdminConsoleShell active="users">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">User Management & Access Control</h1>
            <p className="mt-2 text-sm text-gray-600">
              Granular permission system with role-based access and audit trails
            </p>
          </div>

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

          <div className="mb-8 grid grid-cols-4 gap-4">
            {userStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-xs text-gray-600">{stat.active || stat.roles || stat.trend || stat.period}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
            >
              <h2 className="mb-4 text-lg font-bold text-gray-900">User Controls</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/auth?mode=signup"
                  className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Add User
                </Link>
                <Link
                  href="/admin/export?entity=users"
                  className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Export Users
                </Link>
                <Link
                  href="/admin/settings"
                  className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  View Audit Log
                </Link>
                <Link
                  href="#roles"
                  className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Manage Roles
                </Link>
              </div>
            </div>

            <div
              id="roles"
              className="rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
            >
              <h2 className="mb-4 text-lg font-bold text-gray-900">User Roles</h2>
              <div className="space-y-3">
                {roles.map((role, idx) => (
                  <div
                    key={role.name}
                    className="rounded border border-gray-200 p-3"
                    style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{role.label}</p>
                      <span className="text-xs font-bold text-gray-700">{role.users} users</span>
                    </div>
                    <p className="text-xs text-gray-600">{role.permissions}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.4s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Active Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No users in scope. Complete onboarding or link your profile to a company.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        style={{ animation: `fadeIn 0.5s ease-out ${0.45 + idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{user.full_name || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{user.email || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{getRoleLabel(user.role)}</td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {companyId ? (
                            <form action={updateAdminUserRoleAction} className="flex items-center gap-2">
                              <input type="hidden" name="userId" value={user.id} />
                              <select
                                name="role"
                                defaultValue={user.role}
                                className="rounded border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                              >
                                {ALL_ROLE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                              >
                                Save
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-gray-500">Set company first</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
