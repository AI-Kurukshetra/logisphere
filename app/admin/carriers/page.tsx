import Link from "next/link";
import {
  createAdminCarrierAction,
  createAdminContractAction,
  updateAdminCarrierStatusAction,
} from "@/app/admin/actions";
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
  title: "Carrier Management",
  description: "Multi-carrier rate and contract management",
};

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile, supabase } = await requirePlatformAdmin();
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const compose = readParam(params, "compose");
  const companyId = profile?.company_id ?? null;

  const [carrierList, companyContracts] = await Promise.all([
    supabase
      .from("carriers")
      .select("id, name, code, status, contact_email, contact_phone, created_at")
      .order("name"),
    companyId
      ? supabase
          .from("contracts")
          .select("id, name, carrier_id, effective_from, effective_to")
          .eq("company_id", companyId)
          .order("effective_from", { ascending: false })
          .limit(8)
      : Promise.resolve({
          data: [] as Array<{
            carrier_id: string;
            effective_from: string;
            effective_to: string | null;
            id: string;
            name: string | null;
          }>,
        }),
  ]);
  const carriers = carrierList.data ?? [];
  const contracts = companyContracts.data ?? [];

  return (
    <AdminConsoleShell active="carriers">
      <div>
          <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Carrier Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage carriers, contracts, status controls, and export workflows.
              </p>
            </div>
            {!companyId ? (
              <Link
                href="/admin/settings?compose=bootstrap"
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Create Workspace Company
              </Link>
            ) : null}
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

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.1s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Carrier Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href="/admin/carriers?compose=carrier"
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Carrier
              </Link>
              <Link
                href={companyId ? "/admin/carriers?compose=contract" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Contract
              </Link>
              <Link
                href="/admin/rates"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                View Analytics
              </Link>
              <Link
                href="/admin/export?entity=carriers"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export Data
              </Link>
            </div>
          </div>

          {compose === "carrier" ? (
            <form
              action={createAdminCarrierAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.16s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Carrier</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="name"
                  placeholder="FedEx"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="code"
                  placeholder="FEDEX"
                  className="rounded border border-gray-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500"
                />
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="ops@carrier.com"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <input
                  name="contactPhone"
                  placeholder="+1 555 0100"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Carrier
                </button>
                <Link
                  href="/admin/carriers"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          {compose === "contract" ? (
            <form
              action={createAdminContractAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Contract</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select
                  name="carrierId"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
                <input
                  name="name"
                  placeholder="2026 national agreement"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <input
                  name="effectiveFrom"
                  type="date"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="effectiveTo"
                  type="date"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <textarea
                  name="terms"
                  placeholder="SLA notes and pricing terms"
                  className="min-h-28 rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 md:col-span-2"
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Contract
                </button>
                <Link
                  href="/admin/carriers"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div
              className="rounded-lg border border-gray-300 bg-white overflow-hidden"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <div className="border-b border-gray-300 p-6">
                <h2 className="text-lg font-bold text-gray-900">Carriers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-300 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Carrier</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                          No carriers in database yet.
                        </td>
                      </tr>
                    ) : (
                      carriers.map((carrier, idx) => (
                        <tr
                          key={carrier.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                          style={{ animation: `fadeIn 0.5s ease-out ${0.28 + idx * 0.05}s both` }}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{carrier.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{carrier.code || "—"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${
                                carrier.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {carrier.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {carrier.contact_email || carrier.contact_phone || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap items-center gap-3">
                              <Link
                                href="/admin/rates?compose=rate"
                                className="font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Rates
                              </Link>
                              <form action={updateAdminCarrierStatusAction}>
                                <input type="hidden" name="carrierId" value={carrier.id} />
                                <input
                                  type="hidden"
                                  name="nextStatus"
                                  value={carrier.status === "active" ? "inactive" : "active"}
                                />
                                <button
                                  type="submit"
                                  className="font-semibold text-gray-700 hover:text-gray-900"
                                >
                                  {carrier.status === "active" ? "Disable" : "Enable"}
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className="rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.28s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">Recent Contracts</h2>
              <div className="mt-5 space-y-3">
                {contracts.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {companyId
                      ? "No contracts in company scope yet."
                      : "Create a workspace company first, then add contracts."}
                  </p>
                ) : (
                  contracts.map((contract) => {
                    const carrier = carriers.find((item) => item.id === contract.carrier_id);
                    return (
                      <div key={contract.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                        <p className="font-semibold text-gray-900">{contract.name || "Contract"}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {carrier?.name || "Carrier"} • {contract.effective_from}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Expires {contract.effective_to || "Open-ended"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
