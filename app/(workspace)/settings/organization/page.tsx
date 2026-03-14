import {
  createBusinessUnitAction,
  createFacilityAction,
  createRegionAction,
} from "@/app/(workspace)/settings/organization/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("regions.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [regions, businessUnits, facilities] = await Promise.all([
    supabase
      .from("regions")
      .select("id, name, code, description")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("business_units")
      .select("id, name, code, region_id")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("facilities")
      .select("id, name, code, type, region_id, business_unit_id, address, status")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Organization Setup
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Manage company hierarchy for {company?.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Sprint 1 now includes the multi-location structure that later
          shipment, reporting, and compliance workflows will rely on.
        </p>
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

      <section className="grid gap-6 xl:grid-cols-3">
        <form
          action={createRegionAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Region
          </p>
          <div className="mt-5 space-y-4">
            <input
              name="name"
              type="text"
              placeholder="Midwest"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="code"
              type="text"
              placeholder="MW"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900 focus:bg-white"
            />
            <textarea
              name="description"
              placeholder="Regional operating cluster"
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create Region
            </button>
          </div>
        </form>

        <form
          action={createBusinessUnitAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Business Unit
          </p>
          <div className="mt-5 space-y-4">
            <input
              name="name"
              type="text"
              placeholder="Retail Freight"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="code"
              type="text"
              placeholder="RTL"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900 focus:bg-white"
            />
            <select
              name="regionId"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="">No parent region</option>
              {(regions.data ?? []).map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <textarea
              name="description"
              placeholder="Business segment or cost center"
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create Business Unit
            </button>
          </div>
        </form>

        <form
          action={createFacilityAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Facility
          </p>
          <div className="mt-5 space-y-4">
            <input
              name="name"
              type="text"
              placeholder="Dallas Crossdock"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="code"
                type="text"
                placeholder="DAL-XD"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-900 focus:bg-white"
              />
              <input
                name="type"
                type="text"
                placeholder="crossdock"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
            <select
              name="regionId"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="">No region</option>
              {(regions.data ?? []).map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <select
              name="businessUnitId"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
            >
              <option value="">No business unit</option>
              {(businessUnits.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="city"
                type="text"
                placeholder="Dallas"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
              <input
                name="country"
                type="text"
                placeholder="United States"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="contactName"
                type="text"
                placeholder="Site lead"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
              <input
                name="contactEmail"
                type="email"
                placeholder="site@company.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Create Facility
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Regions
          </p>
          <div className="mt-5 space-y-3">
            {(regions.data ?? []).map((region) => (
              <div
                key={region.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{region.name}</p>
                <p className="mt-1 text-sm text-slate-500">{region.code || "No code"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Business Units
          </p>
          <div className="mt-5 space-y-3">
            {(businessUnits.data ?? []).map((unit) => (
              <div
                key={unit.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{unit.name}</p>
                <p className="mt-1 text-sm text-slate-500">{unit.code || "No code"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Facilities
          </p>
          <div className="mt-5 space-y-3">
            {(facilities.data ?? []).map((facility) => (
              <div
                key={facility.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{facility.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {facility.code || "No code"} • {facility.type || "facility"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
