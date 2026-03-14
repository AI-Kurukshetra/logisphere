import { createDocumentAction } from "@/app/(workspace)/documents/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("documents.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [documents, invoices, shipments, contracts] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, document_type, storage_path, entity_type, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("invoices").select("id, invoice_number").eq("company_id", company!.id).limit(20),
    supabase.from("shipments").select("id, tracking_number").eq("company_id", company!.id).limit(20),
    supabase.from("contracts").select("id, name").eq("company_id", company!.id).limit(20),
  ]);

  const entityOptions = [
    ...(invoices.data ?? []).map((item) => ({
      label: `Invoice • ${item.invoice_number}`,
      type: "invoice",
      value: `invoice:${item.id}`,
    })),
    ...(shipments.data ?? []).map((item) => ({
      label: `Shipment • ${item.tracking_number}`,
      type: "shipment",
      value: `shipment:${item.id}`,
    })),
    ...(contracts.data ?? []).map((item) => ({
      label: `Contract • ${item.name || item.id}`,
      type: "contract",
      value: `contract:${item.id}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Documents
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Register contracts, invoices, and POD artifacts
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Phase 1 document management starts with tenant-scoped metadata and
          storage path registration, ready for storage and OCR workflows later.
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={createDocumentAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Register Document
          </p>
          <div className="mt-5 grid gap-4">
            <input
              name="title"
              placeholder="Carrier contract renewal"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="documentType"
              placeholder="contract"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="storagePath"
              placeholder="documents/contracts/carrier-2026.pdf"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <select
              name="entityRef"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            >
              <option value="">No linked entity</option>
              {entityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Register Document
            </button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Library
          </p>
          <div className="mt-5 space-y-3">
            {(documents.data ?? []).map((document) => (
              <div key={document.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{document.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {document.document_type} • {document.entity_type || "unlinked"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {document.storage_path || "No storage path"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
