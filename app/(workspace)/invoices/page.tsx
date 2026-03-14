import {
  createInvoiceAction,
  runInvoiceAuditAction,
} from "@/app/(workspace)/invoices/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("invoices.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [carriers, shipments, invoices, audits] = await Promise.all([
    supabase.from("carriers").select("id, name").order("name"),
    supabase.from("shipments").select("id, tracking_number").eq("company_id", company!.id).limit(20),
    supabase
      .from("invoices")
      .select("id, carrier_id, invoice_number, amount, status, approval_status, shipment_id")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("audits")
      .select("id, invoice_id, rule_name, result, variance_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">Invoices</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Invoice intake and audit validation</h1>
      </section>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form action={createInvoiceAction} className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">New Invoice</p>
          <div className="mt-5 grid gap-4">
            <select name="carrierId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required>
              <option value="">Select carrier</option>
              {(carriers.data ?? []).map((carrier) => (
                <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
              ))}
            </select>
            <select name="shipmentId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white">
              <option value="">No linked shipment</option>
              {(shipments.data ?? []).map((shipment) => (
                <option key={shipment.id} value={shipment.id}>{shipment.tracking_number}</option>
              ))}
            </select>
            <input name="invoiceNumber" placeholder="INV-2026-001" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="amount" type="number" step="0.01" placeholder="245.00" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              <input name="dueDate" type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input name="originZone" placeholder="Zone A" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="destZone" placeholder="Zone B" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="weightKg" type="number" step="0.01" placeholder="12.5" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
            </div>
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Create Invoice</button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Invoice Queue</p>
          <div className="mt-5 space-y-3">
            {(invoices.data ?? []).map((invoice) => {
              const carrier = carriers.data?.find((item) => item.id === invoice.carrier_id);
              const latestAudit = audits.data?.find((item) => item.invoice_id === invoice.id);
              return (
                <div key={invoice.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {carrier?.name || "Carrier"} • ${invoice.amount} • {invoice.status}
                      </p>
                      {latestAudit ? (
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          Last audit: {latestAudit.result}
                        </p>
                      ) : null}
                    </div>
                    <form action={runInvoiceAuditAction}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                        Run Audit
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
