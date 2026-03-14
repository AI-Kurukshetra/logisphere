import { requirePermission } from "@/lib/supabase/session";

export default async function AuditTrailPage() {
  const { company, supabase } = await requirePermission("audit.read");
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id, action, entity_type, summary, metadata, created_at, actor_profile_id")
    .eq("company_id", company!.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const actorIds = [...new Set((logs ?? []).map((item) => item.actor_profile_id).filter(Boolean))];
  const actorResponse = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", actorIds)
    : { data: [] as Array<{ email: string | null; full_name: string | null; id: string }> };
  const actors = actorResponse.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Audit Trail
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Activity log for {company?.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Role changes, onboarding, and organization setup actions are written
          here to support operational oversight from Sprint 1 onward.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="space-y-4">
          {(logs ?? []).length ? (
            (logs ?? []).map((log) => {
              const actor = actors.find((item) => item.id === log.actor_profile_id);
              return (
                <article
                  key={log.id}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{log.summary}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {actor?.full_name || actor?.email || "Unknown actor"} •{" "}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {log.action}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {log.entity_type}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-500">
              No activity has been recorded for this company yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
