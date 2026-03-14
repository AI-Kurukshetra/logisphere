import Link from "next/link";
import { createAdminReportAction } from "@/app/admin/actions";
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
  title: "Reports",
  description: "Custom reporting engine with scheduling",
};

export default async function ReportsPage({
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

  const reportsRes = companyId
    ? await supabase
        .from("reports")
        .select("id, name, type, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] as Array<{ created_at: string; id: string; name: string; type: string }> };
  const reports = reportsRes.data ?? [];

  const reportStats = [
    { label: "Generated This Month", value: String(reports.length), trend: "Live rows" },
    { label: "Scheduled Reports", value: String(reports.length), active: companyId ? "Company scope" : "Configure workspace" },
    { label: "Avg Generation Time", value: "Direct", status: "DB-backed" },
    { label: "Export Formats", value: "1", available: "CSV" },
  ];

  return (
    <AdminConsoleShell active="reports">
      <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Custom Reporting Engine</h1>
            <p className="mt-2 text-sm text-gray-600">Drag-and-drop report builder with scheduled delivery</p>
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
            {reportStats.map((stat, idx) => (
              <div
                key={stat.label}
                className="rounded-lg border border-gray-300 bg-white p-6"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <p className="text-xs font-semibold uppercase text-gray-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-xs text-gray-600">{stat.trend || stat.active || stat.status || stat.available}</p>
              </div>
            ))}
          </div>

          <div
            className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
            style={{ animation: "fadeIn 0.6s ease-out 0.2s both" }}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">Report Controls</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <Link
                href={companyId ? "/admin/reports?compose=report" : "/admin/settings?compose=bootstrap"}
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Create Report
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Generate Now
              </Link>
              <Link
                href="#report-list"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                View History
              </Link>
              <Link
                href="/admin/export?entity=reports"
                className="rounded border border-gray-300 px-4 py-2.5 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Export
              </Link>
            </div>
          </div>

          {compose === "report" ? (
            <form
              action={createAdminReportAction}
              className="mb-8 rounded-lg border border-gray-300 bg-white p-6"
              style={{ animation: "fadeIn 0.6s ease-out 0.24s both" }}
            >
              <h2 className="text-lg font-bold text-gray-900">New Report</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="name"
                  placeholder="Carrier performance report"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                />
                <select
                  name="type"
                  className="rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select type</option>
                  {["daily", "weekly", "monthly", "exception_summary", "finance"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Report
                </button>
                <Link
                  href="/admin/reports"
                  className="rounded border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : null}

          <div
            id="report-list"
            className="rounded-lg border border-gray-300 bg-white overflow-hidden"
            style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}
          >
            <div className="border-b border-gray-300 p-6">
              <h2 className="text-lg font-bold text-gray-900">Scheduled Reports</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-300 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Report Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Format</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No report rows in scope yet.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report, idx) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        style={{ animation: `fadeIn 0.5s ease-out ${0.35 + idx * 0.05}s both` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{report.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{report.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{report.created_at}</td>
                        <td className="px-6 py-4">
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                            CSV
                          </span>
                        </td>
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
