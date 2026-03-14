import {
  createCarrierAction,
  createContractAction,
} from "@/app/(workspace)/carriers/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function CarriersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("carriers.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [carriers, contracts] = await Promise.all([
    supabase
      .from("carriers")
      .select("id, name, code, contact_email, contact_phone, status")
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("id, name, carrier_id, effective_from, effective_to")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Carrier Setup
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Manage carriers and contracts
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Phase 1 rate and invoice workflows depend on carrier master data and
          company-specific contracts being available first.
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

      <section className="grid gap-6 xl:grid-cols-2">
        <form
          action={createCarrierAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            New Carrier
          </p>
          <div className="mt-5 grid gap-4">
            <input name="name" placeholder="FedEx" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
            <input name="code" placeholder="FEDEX" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase outline-none focus:border-slate-900 focus:bg-white" />
            <input name="contactEmail" type="email" placeholder="contact@carrier.com" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            <input name="contactPhone" placeholder="+1 555 0100" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Create Carrier</button>
          </div>
        </form>

        <form
          action={createContractAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            New Contract
          </p>
          <div className="mt-5 grid gap-4">
            <select name="carrierId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required>
              <option value="">Select carrier</option>
              {(carriers.data ?? []).map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
            <input name="name" placeholder="2026 national agreement" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            <input name="effectiveFrom" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
            <input name="effectiveTo" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            <textarea name="terms" placeholder="SLA notes and approval terms" className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Create Contract</button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Carriers</p>
          <div className="mt-5 space-y-3">
            {(carriers.data ?? []).map((carrier) => (
              <div key={carrier.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{carrier.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {carrier.code || "No code"} • {carrier.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Contracts</p>
          <div className="mt-5 space-y-3">
            {(contracts.data ?? []).map((contract) => {
              const carrier = carriers.data?.find((item) => item.id === contract.carrier_id);
              return (
                <div key={contract.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{contract.name || contract.id}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {carrier?.name || "Unknown carrier"} • {contract.effective_from}
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
