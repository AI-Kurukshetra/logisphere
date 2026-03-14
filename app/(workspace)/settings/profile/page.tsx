import Link from "next/link";
import {
  updateCompanyProfileAction,
  updateProfileAction,
} from "@/app/(workspace)/settings/profile/actions";
import { getRoleLabel } from "@/lib/roles";
import { requireWorkspace } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ProfileTab = "company" | "personal";

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function resolveTab(value: string): ProfileTab {
  return value === "company" ? "company" : "personal";
}

function tabClass(isActive: boolean) {
  return isActive
    ? "rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold !text-white"
    : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-950";
}

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, profile, supabase, user } = await requireWorkspace();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const activeTab = resolveTab(readParam(params, "tab"));
  const canManageScope = profile?.role === "admin";

  const [regions, businessUnits, facilities] = await Promise.all([
    supabase.from("regions").select("id, name").eq("company_id", company!.id).order("name"),
    supabase
      .from("business_units")
      .select("id, name")
      .eq("company_id", company!.id)
      .order("name"),
    supabase.from("facilities").select("id, name").eq("company_id", company!.id).order("name"),
  ]);

  const regionName =
    regions.data?.find((item) => item.id === profile?.region_id)?.name ?? "Unscoped";
  const businessUnitName =
    businessUnits.data?.find((item) => item.id === profile?.business_unit_id)?.name ??
    "Unscoped";
  const facilityName =
    facilities.data?.find((item) => item.id === profile?.facility_id)?.name ?? "Unscoped";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Profile
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Manage your operator record in focused sections.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
          Personal details and company-linked details are separated below so each
          tab shows only the relevant fields and update flow.
        </p>

        <div className="mt-10 space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Email
            </p>
            <p className="mt-2 text-lg font-semibold">{profile?.email || user.email}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Role
            </p>
            <p className="mt-2 text-lg font-semibold">{getRoleLabel(profile?.role)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Company
            </p>
            <p className="mt-2 text-lg font-semibold">{company?.name}</p>
            <p className="mt-1 text-sm text-slate-300">{company?.slug}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Region
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{regionName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Business Unit
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{businessUnitName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Facility
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{facilityName}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Update
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Edit profile details
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/settings/profile?tab=personal" className={tabClass(activeTab === "personal")}>
              Personal Details
            </Link>
            <Link href="/settings/profile?tab=company" className={tabClass(activeTab === "company")}>
              Company Details
            </Link>
          </div>
          <p className="text-sm leading-6 text-slate-500">
            {activeTab === "personal"
              ? "Update identity, contact, and presentation details used across the workspace."
              : "Manage company-linked context such as company name and scope assignments."}
          </p>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {activeTab === "personal" ? (
          <form action={updateProfileAction} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={(profile?.email ?? user?.email ?? "") || ""}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                Supabase may ask you to confirm the new email address.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input
                name="fullName"
                type="text"
                defaultValue={(profile?.full_name ?? "") || ""}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Avatar URL</label>
              <input
                name="avatarUrl"
                type="url"
                defaultValue={(profile?.avatar_url ?? "") || ""}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Job title</label>
              <input
                name="jobTitle"
                type="text"
                defaultValue={(profile?.job_title ?? "") || ""}
                placeholder="Logistics Manager"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Update Personal Details
            </button>
          </form>
        ) : (
          <form action={updateCompanyProfileAction} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Company name</label>
              <input
                name="companyName"
                type="text"
                defaultValue={(company?.name ?? "") || ""}
                disabled={!canManageScope}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Company slug</label>
              <input
                defaultValue={company?.slug ?? ""}
                readOnly
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Region</label>
                <select
                  name="regionId"
                  defaultValue={profile?.region_id ?? ""}
                  disabled={!canManageScope}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Unscoped</option>
                  {(regions.data ?? []).map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Business unit</label>
                <select
                  name="businessUnitId"
                  defaultValue={profile?.business_unit_id ?? ""}
                  disabled={!canManageScope}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Unscoped</option>
                  {(businessUnits.data ?? []).map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Facility</label>
                <select
                  name="facilityId"
                  defaultValue={profile?.facility_id ?? ""}
                  disabled={!canManageScope}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Unscoped</option>
                  {(facilities.data ?? []).map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!canManageScope ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Company name and scope assignments are editable only by admins.
              </p>
            ) : null}

          </form>
        )}
      </section>
    </div>
  );
}
