import Link from "next/link";
import { createAdminRateAction } from "@/app/admin/actions";
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
  title: "Rates & Contracts",
  description: "Rate management and contract tracking",
};

export default async function RatesPage({
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

  const [contractsRes, ratesRes, carriersRes] = await Promise.all([
    companyId
      ? supabase
          .from("contracts")
          .select("id, name, carrier_id, effective_from, effective_to")
          .eq("company_id", companyId)
          .order("effective_from", { ascending: false })
          .limit(20)
      : Promise.resolve({
          data: [] as Array<{
            carrier_id: string;
            effective_from: string;
            effective_to: string | null;
            id: string;
            name: string | null;
          }>,
        }),
    supabase
      .from("rates")
      .select("id, carrier_id, contract_id, rate_amount, currency, effective_from, effective_to")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("carriers").select("id, name"),
  ]);
  const contracts = contractsRes.data ?? [];
  const rates = ratesRes.data ?? [];
  const carriers = (carriersRes.data ?? []) as Array<{ id: string; name: string }>;

  const rateCards = [
    { metric: "Active Contracts", value: String(contracts.length), change: "Company scope" },
    { metric: "Rate Entries", value: String(rates.length), change: "All carriers" },
    { metric: "Carriers", value: String(carriers.length), change: "With rates" },
    { metric: "Data Source", value: "Supabase", change: "Live" },
  ];

  const contractRows = contracts.map((contract) => {
    const carrier = carriers.find((item) => item.id === contract.carrier_id);
    const carrierRate = rates.find((rate) => rate.contract_id === contract.id || rate.carrier_id === contract.carrier_id);
    return {
      carrier: carrier?.name ?? "—",
      expiry: contract.effective_to ?? "—",
      rate: carrierRate ? `$${Number(carrierRate.rate_amount).toLocaleString()}` : "—",
      status:
        contract.effective_to && new Date(contract.effective_to) < new Date()
          ? "expired"
          : "active",
      type: contract.name || "Contract",
    };
  });

  return (
    <AdminConsoleShell active="rates">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Rates & Contracts</h1>
            <p className="mt-2 text-sm text-gray-600">Centralized rate management and contract tracking</p>
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
            {rateCards.map((card, idx) => (
              <div
                key={card.metric}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{card.metric}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-2 text-xs text-blue-600">{card.change}</p>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Rate Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/carriers?compose=contract" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + New Contract
              </Link>
              <Link
                href="/admin/rates?compose=rate"
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Rate
              </Link>
              <Link
                href="/admin/carriers"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Carrier Comparison
              </Link>
              <Link
                href="/admin/export?entity=rates"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export
              </Link>
            </div>
          </div>

          {compose === "rate" ? (
            <form
              action={createAdminRateAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.25s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Rate</h2>
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
                <select
                  name="contractId"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">No contract</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name || contract.id}
                    </option>
                  ))}
                </select>
                <input
                  name="rateAmount"
                  type="number"
                  step="0.01"
                  placeholder="245.00"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
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
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Rate
                </button>
                <Link
                  href="/admin/rates"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Active Contracts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Carrier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contractRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No contracts in scope.
                      </td>
                    </tr>
                  ) : (
                    contractRows.map((contract, idx) => (
                      <tr
                        key={`${contract.carrier}-${contract.type}-${idx}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{contract.carrier}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{contract.type}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{contract.rate}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{contract.expiry}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              contract.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {contract.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Latest Rates</h2>
            <div className="mt-5 grid gap-3">
              {rates.length === 0 ? (
                <p className="text-sm text-gray-500">No rate rows yet.</p>
              ) : (
                rates.map((rate) => {
                  const carrier = carriers.find((item) => item.id === rate.carrier_id);
                  return (
                    <div key={rate.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        {carrier?.name || "Carrier"} • ${Number(rate.rate_amount).toLocaleString()} {rate.currency}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Effective {rate.effective_from} {rate.effective_to ? `to ${rate.effective_to}` : ""}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
