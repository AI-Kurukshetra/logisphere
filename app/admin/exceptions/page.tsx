import Link from "next/link";
import {
  autoDetectAdminExceptionsAction,
  createAdminExceptionAction,
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
  title: "Exception Management",
  description: "Automated exception detection and workflow",
};

export default async function ExceptionsPage({
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

  const [invoicesRes, carriersRes] = await Promise.all([
    companyId
      ? supabase
          .from("invoices")
          .select("id, invoice_number, amount, status, carrier_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({
          data: [] as Array<{
            amount: number;
            carrier_id: string;
            id: string;
            invoice_number: string;
            status: string;
          }>,
        }),
    supabase.from("carriers").select("id, name"),
  ]);
  const invoices = invoicesRes.data ?? [];
  const carriers = (carriersRes.data ?? []) as Array<{ id: string; name: string }>;
  const exceptionInvoices = invoices.filter((invoice) => invoice.status === "exception");

  const exceptionStats = [
    { label: "Open Exceptions", value: String(exceptionInvoices.length), priority: "Invoice status" },
    { label: "Company Scope", value: companyId ? "Yes" : "No", trend: "Set company for data" },
    { label: "Data Source", value: "Supabase", status: "Live" },
    { label: "Resolved", value: "—", rate: "Update status in audits/payments" },
  ];

  return (
    <AdminConsoleShell active="exceptions">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Exception Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Automated detection and workflow management for exceptions
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
            {exceptionStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-xs text-gray-600">
                  {stat.priority || stat.trend || stat.status || stat.rate}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Exception Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/exceptions?compose=exception" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Exception
              </Link>
              <form action={autoDetectAdminExceptionsAction}>
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Auto-Detect Issues
                </button>
              </form>
              <Link
                href="/admin/reports?compose=report"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Escalate
              </Link>
              <Link
                href="/admin/export?entity=invoices"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export
              </Link>
            </div>
          </div>

          {compose === "exception" ? (
            <form
              action={createAdminExceptionAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Exception</h2>
              <div className="mt-5 grid gap-4">
                <select
                  name="invoiceId"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select invoice</option>
                  {invoices
                    .filter((invoice) => invoice.status !== "paid")
                    .map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number}
                      </option>
                    ))}
                </select>
                <textarea
                  name="notes"
                  placeholder="Issue details, dispute notes, or escalation summary"
                  className="min-h-28 rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Exception
                </button>
                <Link
                  href="/admin/exceptions"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Active Exceptions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {exceptionInvoices.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No invoice exceptions in scope.</div>
              ) : (
                exceptionInvoices.map((invoice, idx) => {
                  const carrier = carriers.find((item) => item.id === invoice.carrier_id);
                  return (
                    <div
                      key={invoice.id}
                      className="p-6 hover:bg-gray-50"
                      style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Invoice exception</p>
                          <p className="mt-1 text-sm text-gray-600">
                            {invoice.invoice_number} • {carrier?.name || "—"} • $
                            {Number(invoice.amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                            high
                          </span>
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                            open
                          </span>
                        </div>
                      </div>
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
