import Link from "next/link";
import {
  createAdminInvoiceAction,
  runAdminAuditAction,
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
  title: "Invoice Auditing",
  description: "AI-powered invoice audit system",
};

export default async function InvoiceAuditingPage({
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

  const [invoicesRes, auditsRes, carriersRes] = await Promise.all([
    companyId
      ? supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, approval_status, carrier_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({
          data: [] as Array<{
            amount: number;
            approval_status: string | null;
            carrier_id: string;
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
                created_at: string;
                id: string;
                invoice_id: string;
                result: string;
                variance_amount: number | null;
              }>,
            };
          }
          return supabase
            .from("audits")
            .select("id, invoice_id, result, variance_amount, created_at")
            .in("invoice_id", ids)
            .order("created_at", { ascending: false })
            .limit(20);
        })()
      : Promise.resolve({
          data: [] as Array<{
            created_at: string;
            id: string;
            invoice_id: string;
            result: string;
            variance_amount: number | null;
          }>,
        }),
    supabase.from("carriers").select("id, name"),
  ]);
  const invoices = invoicesRes.data ?? [];
  const audits = auditsRes.data ?? [];
  const carriers = (carriersRes.data ?? []) as Array<{ id: string; name: string }>;
  const approved = invoices.filter(
    (invoice) => invoice.approval_status === "approved" || invoice.status === "paid"
  ).length;
  const exception = invoices.filter((invoice) => invoice.status === "exception").length;

  const auditStats = [
    { label: "Total Invoices", value: String(invoices.length), processed: String(approved) },
    { label: "Approved", value: String(approved), trend: invoices.length ? `${Math.round((approved / invoices.length) * 100)}%` : "—" },
    { label: "Exceptions", value: String(exception), trend: "Company scope" },
    { label: "Audit Runs", value: String(audits.length), trend: "Last 20" },
  ];

  const recentAudits = audits.slice(0, 10).map((audit) => {
    const invoice = invoices.find((item) => item.id === audit.invoice_id);
    return {
      amount: invoice ? `$${Number(invoice.amount).toLocaleString()}` : "—",
      carrier: invoice
        ? carriers.find((carrier) => carrier.id === invoice.carrier_id)?.name ?? "—"
        : "—",
      id: invoice?.invoice_number ?? audit.invoice_id,
      saving:
        audit.variance_amount != null
          ? `$${Math.abs(Number(audit.variance_amount)).toFixed(2)}`
          : "—",
      status: audit.result,
    };
  });

  return (
    <AdminConsoleShell active="audits">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Automated Invoice Auditing</h1>
            <p className="mt-2 text-sm text-gray-600">
              AI-powered validation against contracts, rates, and shipping terms
            </p>
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
            {auditStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-xs text-green-600">{stat.processed || stat.trend}</p>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Audit Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/audits?compose=invoice" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Upload Invoices
              </Link>
              <form action={runAdminAuditAction}>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Audit
                </button>
              </form>
              <Link
                href="#recent-audits"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Audit History
              </Link>
              <Link
                href="/admin/export?entity=invoices"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export Results
              </Link>
            </div>
          </div>

          {compose === "invoice" ? (
            <form
              action={createAdminInvoiceAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Invoice</h2>
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
                  name="invoiceNumber"
                  placeholder="INV-2026-001"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="1250.00"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Invoice
                </button>
                <Link
                  href="/admin/audits"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            id="recent-audits"
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Audits</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Carrier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No audit runs in scope yet.
                      </td>
                    </tr>
                  ) : (
                    recentAudits.map((audit, idx) => (
                      <tr
                        key={`${audit.id}-${idx}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{audit.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{audit.carrier}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{audit.amount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              audit.status === "pass" || audit.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : audit.status === "fail" || audit.status === "exception"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {audit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{audit.saving}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </AdminConsoleShell>
  );
}
