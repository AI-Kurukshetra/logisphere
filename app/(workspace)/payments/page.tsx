import {
  approveInvoiceAction,
  createPaymentAction,
} from "@/app/(workspace)/payments/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("payments.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const { data: companyInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount, status, approval_status")
    .eq("company_id", company!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const invoiceIds = (companyInvoices ?? []).map((i) => i.id);
  const { data: paymentsData } =
    invoiceIds.length > 0
      ? await supabase
          .from("payments")
          .select("id, invoice_id, amount, status, paid_at, method, reference")
          .in("invoice_id", invoiceIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] as Array<{ id: string; invoice_id: string; amount: number; status: string; paid_at: string | null; method: string | null; reference: string | null }> };

  const invoices = { data: companyInvoices };
  const payments = { data: paymentsData };

  const payableInvoices = (invoices.data ?? []).filter(
    (invoice) => invoice.status !== "paid"
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">Payments</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Approval routing and payment records</h1>
      </section>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Approval Queue</p>
            <div className="mt-5 space-y-3">
              {payableInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      ${invoice.amount} • {invoice.status} • {invoice.approval_status || "unreviewed"}
                    </p>
                  </div>
                  <form action={approveInvoiceAction}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                      Approve
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>

          <form action={createPaymentAction} className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Record Payment</p>
            <div className="mt-5 grid gap-4">
              <select name="invoiceId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required>
                <option value="">Select invoice</option>
                {payableInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>{invoice.invoice_number}</option>
                ))}
              </select>
              <input name="amount" type="number" step="0.01" placeholder="245.00" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              <input name="method" placeholder="wire" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="reference" placeholder="PAY-2026-001" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Record Payment</button>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Recent Payments</p>
          <div className="mt-5 space-y-3">
            {(payments.data ?? []).map((payment) => {
              const invoice = invoices.data?.find((item) => item.id === payment.invoice_id);
              return (
                <div key={payment.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{invoice?.invoice_number || payment.invoice_id}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    ${payment.amount} • {payment.status} • {payment.method || "method n/a"}
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
