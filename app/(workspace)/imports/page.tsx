import {
  createExportJobAction,
  createImportJobAction,
} from "@/app/(workspace)/imports/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("imports.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [imports, exports] = await Promise.all([
    supabase
      .from("import_jobs")
      .select("id, entity_type, source_name, file_name, status, row_count, processed_count, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("export_jobs")
      .select("id, entity_type, format, file_name, status, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Data Pipelines
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Import and export jobs for {company?.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Phase 1 now includes the operational entry point for bulk rate,
          invoice, and shipment ingestion together with export queue tracking.
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
          action={createImportJobAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            New Import
          </p>
          <div className="mt-5 grid gap-4">
            <input
              name="entityType"
              placeholder="invoices"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="sourceName"
              placeholder="SFTP upload"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="fileName"
              placeholder="march-invoices.csv"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <input
              name="rowCount"
              type="number"
              min="0"
              placeholder="250"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Create Import Job
            </button>
          </div>
        </form>

        <form
          action={createExportJobAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            New Export
          </p>
          <div className="mt-5 grid gap-4">
            <input
              name="entityType"
              placeholder="rates"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="format"
              placeholder="csv"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <input
              name="fileName"
              placeholder="rates-export.csv"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Queue Export
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Recent Imports
          </p>
          <div className="mt-5 space-y-3">
            {(imports.data ?? []).map((job) => (
              <div key={job.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{job.entity_type}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {job.source_name} • {job.status} • {job.processed_count}/{job.row_count}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Recent Exports
          </p>
          <div className="mt-5 space-y-3">
            {(exports.data ?? []).map((job) => (
              <div key={job.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{job.entity_type}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {job.format} • {job.status} • {job.file_name || "No filename"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
