import { createRateAction } from "@/app/(workspace)/rates/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function RatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("rates.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [carriers, contracts, rates] = await Promise.all([
    supabase.from("carriers").select("id, name").order("name"),
    supabase.from("contracts").select("id, name, carrier_id").eq("company_id", company!.id),
    supabase
      .from("rates")
      .select("id, carrier_id, contract_id, origin_zone, dest_zone, weight_kg_min, weight_kg_max, rate_amount, effective_from")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Rate Management
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Centralize rate cards and contract-linked pricing
        </h1>
      </section>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createRateAction} className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">New Rate</p>
          <div className="mt-5 grid gap-4">
            <select name="carrierId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required>
              <option value="">Select carrier</option>
              {(carriers.data ?? []).map((carrier) => (
                <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
              ))}
            </select>
            <select name="contractId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white">
              <option value="">No contract</option>
              {(contracts.data ?? []).map((contract) => (
                <option key={contract.id} value={contract.id}>{contract.name || contract.id}</option>
              ))}
            </select>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="originZone" placeholder="Zone A" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="destZone" placeholder="Zone B" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="weightMin" type="number" step="0.01" placeholder="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="weightMax" type="number" step="0.01" placeholder="10" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="rateAmount" type="number" step="0.01" placeholder="45.00" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="effectiveFrom" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              <input name="effectiveTo" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            </div>
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Create Rate</button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Rate Table</p>
          <div className="mt-5 space-y-3">
            {(rates.data ?? []).map((rate) => {
              const carrier = carriers.data?.find((item) => item.id === rate.carrier_id);
              return (
                <div key={rate.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{carrier?.name || "Carrier"} • ${rate.rate_amount}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {rate.origin_zone || "Any"} → {rate.dest_zone || "Any"} • {rate.weight_kg_min || 0}-{rate.weight_kg_max || "open"} kg
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
