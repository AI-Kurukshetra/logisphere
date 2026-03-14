import {
  createWorkspaceReportAction,
  queueReportExportAction,
} from "@/app/(workspace)/reports/actions";
import { requireWorkspace } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function toLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, permissions, supabase } = await requireWorkspace();
  if (!permissions.includes("audit.read")) {
    return null;
  }

  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [reportsRes, exportsRes] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, type, params, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("export_jobs")
      .select("id, entity_type, file_name, format, status, created_at")
      .eq("company_id", company!.id)
      .eq("entity_type", "reports")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const reports = reportsRes.data ?? [];
  const exports = exportsRes.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#111827_0%,#1d4ed8_52%,#0f766e_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Reports
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Scheduled reporting and export operations
        </h1>
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
          action={createWorkspaceReportAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Create Report
          </p>
          <div className="mt-5 grid gap-4">
            <input
              name="name"
              placeholder="Weekly carrier scorecard"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="type"
                placeholder="scorecard"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
                required
              />
              <input
                name="focus"
                placeholder="carriers"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="schedule"
                placeholder="weekly"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              />
              <select
                name="visualization"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["table", "line", "bar", "kpi_tiles"].map((visualization) => (
                  <option key={visualization} value={visualization}>
                    {toLabel(visualization)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="dateRange"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["7d", "30d", "90d", "365d"].map((dateRange) => (
                  <option key={dateRange} value={dateRange}>
                    {dateRange.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                name="groupBy"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["carrier", "lane", "facility", "status", "week"].map((groupBy) => (
                  <option key={groupBy} value={groupBy}>
                    {toLabel(groupBy)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Metrics
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {["spend", "shipment_count", "on_time_rate", "audit_fail_rate"].map((metric) => (
                  <label
                    key={metric}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      defaultChecked={metric === "spend"}
                      name="metrics"
                      type="checkbox"
                      value={metric}
                    />
                    {toLabel(metric)}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Dimensions
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {["carrier", "region", "facility", "invoice_status"].map((dimension) => (
                  <label
                    key={dimension}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      defaultChecked={dimension === "carrier"}
                      name="dimensions"
                      type="checkbox"
                      value={dimension}
                    />
                    {toLabel(dimension)}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="format"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["csv", "xlsx", "pdf"].map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Create Report
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Report Library
          </p>
          <div className="mt-5 space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{report.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{report.type}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {toLabel(String((report.params as { visualization?: string } | null)?.visualization ?? "table"))}
                      {" · "}
                      {String((report.params as { date_range?: string } | null)?.date_range ?? "30d").toUpperCase()}
                      {" · "}
                      {toLabel(String((report.params as { group_by?: string } | null)?.group_by ?? "carrier"))}
                    </p>
                  </div>
                  {permissions.includes("imports.manage") ? (
                    <form action={queueReportExportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="reportName" value={report.name} />
                      <input
                        type="hidden"
                        name="format"
                        value={String((report.params as { format?: string } | null)?.format ?? "csv")}
                      />
                      <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                        Queue Export
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Export Queue
        </p>
        <div className="mt-5 space-y-3">
          {exports.map((job) => (
            <div
              key={job.id}
              className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">{job.file_name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {job.format} • {job.status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
