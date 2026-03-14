import { updateMemberAccessAction } from "@/app/(workspace)/settings/access/actions";
import { ALL_ROLE_OPTIONS, getRoleLabel } from "@/lib/roles";
import { requireCompanyAdmin } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}


export default async function AccessSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, permissions, profile, supabase } = await requireCompanyAdmin();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [members, regions, businessUnits, facilities, permissionCatalog, roleMatrix] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, region_id, business_unit_id, facility_id"
        )
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true }),
      supabase.from("regions").select("id, name").eq("company_id", company!.id),
      supabase
        .from("business_units")
        .select("id, name")
        .eq("company_id", company!.id),
      supabase.from("facilities").select("id, name").eq("company_id", company!.id),
      supabase.from("permissions").select("key, category, label").order("category"),
      supabase.from("role_permissions").select("role, permission_key"),
    ]);

  const roleValues = ALL_ROLE_OPTIONS.map((r) => r.value);
  const permissionCards = roleValues.map((role) => ({
    permissions: (roleMatrix.data ?? [])
      .filter((entry) => entry.role === role)
      .map((entry) => entry.permission_key),
    role,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
            Access Control
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Role and permission management
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            This admin screen manages the Sprint 1 access model for {company?.name}.
            Roles map to seeded permissions in Supabase, and member scope can be
            pinned to region, business unit, and facility.
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

        <div className="grid gap-4 md:grid-cols-3">
          {permissionCards.map((card) => (
            <article
              key={card.role}
              className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                {getRoleLabel(card.role)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {card.permissions.length ? (
                  card.permissions.map((permissionKey) => {
                    const label =
                      permissionCatalog.data?.find((item) => item.key === permissionKey)
                        ?.label ?? permissionKey;
                    return (
                      <span
                        key={permissionKey}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-sm text-slate-500">Read-only access</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Team Access
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Manage member role and scope
          </h2>
        </div>

        <div className="mt-8 space-y-4">
          {(members.data ?? []).map((member) => (
            <form
              key={member.id}
              action={updateMemberAccessAction}
              className="grid gap-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-5 lg:grid-cols-[1.1fr_repeat(4,minmax(0,1fr))]"
            >
              <input type="hidden" name="profileId" value={member.id} />
              <div>
                <p className="font-semibold text-slate-900">
                  {member.full_name || member.email}
                </p>
                <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {member.id === profile?.id ? "Current admin" : "Company member"}
                </p>
              </div>

              <label className="text-sm text-slate-600">
                Role
                <select
                  name="role"
                  defaultValue={member.role}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  {ALL_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Region
                <select
                  name="regionId"
                  defaultValue={member.region_id ?? ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  <option value="">Unscoped</option>
                  {(regions.data ?? []).map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                Business unit
                <select
                  name="businessUnitId"
                  defaultValue={member.business_unit_id ?? ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  <option value="">Unscoped</option>
                  {(businessUnits.data ?? []).map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3">
                <label className="min-w-0 flex-1 text-sm text-slate-600">
                  Facility
                  <select
                    name="facilityId"
                    defaultValue={member.facility_id ?? ""}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                  >
                    <option value="">Unscoped</option>
                    {(facilities.data ?? []).map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="self-end rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
