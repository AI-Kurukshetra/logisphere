import Link from "next/link";
import {
  batchAdminPaymentsAction,
  createAdminPaymentAction,
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
  title: "Payment Processing",
  description: "Payment workflow management",
};

export default async function PaymentsPage({
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

  const [invoicesRes, paymentsRes] = await Promise.all([
    companyId
      ? supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, approval_status")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({
          data: [] as Array<{
            amount: number;
            approval_status: string | null;
            id: string;
            invoice_number: string;
            status: string;
          }>,
        }),
    companyId
      ? (async () => {
          const { data: invs } = await supabase.from("invoices").select("id").eq("company_id", companyId);
          const ids = (invs ?? []).map((invoice) => invoice.id);
          if (ids.length === 0) {
            return {
              data: [] as Array<{
                amount: number;
                id: string;
                invoice_id: string;
                paid_at: string | null;
                status: string;
              }>,
            };
          }
          return supabase
            .from("payments")
            .select("id, invoice_id, amount, status, paid_at")
            .in("invoice_id", ids)
            .order("created_at", { ascending: false })
            .limit(20);
        })()
      : Promise.resolve({
          data: [] as Array<{
            amount: number;
            id: string;
            invoice_id: string;
            paid_at: string | null;
            status: string;
          }>,
        }),
  ]);
  const invoices = invoicesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const payableInvoices = invoices.filter((invoice) => invoice.status !== "paid");
  const totalPending = payableInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const completed = payments.filter((payment) => payment.status === "completed").length;

  const paymentStats = [
    { label: "Pending Invoices", value: `$${totalPending.toLocaleString()}`, count: String(payableInvoices.length) },
    { label: "Payments Recorded", value: String(payments.length), count: "Company scope" },
    { label: "Completed", value: String(completed), change: "payments" },
    { label: "Data Source", value: "Supabase", trend: "Live" },
  ];

  return (
    <AdminConsoleShell active="payments">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Payment Processing</h1>
            <p className="mt-2 text-sm text-gray-600">Automated payment workflows with approval routing</p>
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
            {paymentStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-xs text-gray-600">{stat.count || stat.change || stat.trend}</p>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Payment Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/payments?compose=payment" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Process Payment
              </Link>
              <form action={batchAdminPaymentsAction}>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Batch Process
                </button>
              </form>
              <Link
                href="#payment-history"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                View History
              </Link>
              <Link
                href="/admin/settings"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Settings
              </Link>
            </div>
          </div>

          {compose === "payment" ? (
            <form
              action={createAdminPaymentAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select
                  name="invoiceId"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select invoice</option>
                  {payableInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number}
                    </option>
                  ))}
                </select>
                <input
                  name="method"
                  placeholder="wire"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Record Payment
                </button>
                <Link
                  href="/admin/payments"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            id="payment-history"
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Pending Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payableInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No pending payments in scope.
                      </td>
                    </tr>
                  ) : (
                    payableInvoices.map((invoice, idx) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{invoice.invoice_number}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ${Number(invoice.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {invoice.approval_status || "unreviewed"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              invoice.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : invoice.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-gray-300 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Payment Records</h2>
            <div className="mt-5 space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payment records yet.</p>
              ) : (
                payments.map((payment) => {
                  const invoice = invoices.find((item) => item.id === payment.invoice_id);
                  return (
                    <div key={payment.id} className="rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">
                        {invoice?.invoice_number || payment.invoice_id}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        ${Number(payment.amount).toLocaleString()} • {payment.status}
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
