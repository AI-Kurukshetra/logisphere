import {
  createIntegrationAction,
  logWebhookEventAction,
  retryWebhookEventAction,
} from "@/app/(workspace)/integrations/actions";
import { requirePermission } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("imports.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const [integrationsRes, webhookEventsRes] = await Promise.all([
    supabase
      .from("integrations")
      .select("id, name, system_type, mode, status, endpoint_url, auth_type")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("webhook_events")
      .select("id, integration_id, event_type, direction, status, processed_at, error_message")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const integrations = integrationsRes.data ?? [];
  const webhookEvents = webhookEventsRes.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#155e75_52%,#2563eb_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Integrations
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Connected systems and webhook operations
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50">
          Register ERP/WMS/TMS integrations and simulate webhook traffic directly against your
          company scope.
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
          action={createIntegrationAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            New Integration
          </p>
          <div className="mt-5 grid gap-4">
            <input
              name="name"
              placeholder="NetSuite Sync"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <input
              name="systemType"
              placeholder="ERP"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="mode"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["pull", "push", "hybrid"].map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["planned", "active", "paused"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="endpointUrl"
              placeholder="https://api.partner.com/webhooks"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <input
              name="authType"
              placeholder="api_key"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <textarea
              name="notes"
              placeholder="Sync invoices nightly at 02:00 UTC"
              className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Create Integration
            </button>
          </div>
        </form>

        <form
          action={logWebhookEventAction}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Log Webhook Event
          </p>
          <div className="mt-5 grid gap-4">
            <select
              name="integrationId"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
            >
              <option value="">No linked integration</option>
              {integrations.map((integration) => (
                <option key={integration.id} value={integration.id}>
                  {integration.name}
                </option>
              ))}
            </select>
            <input
              name="eventType"
              placeholder="shipment.updated"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="direction"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["inbound", "outbound"].map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              >
                {["pending", "processed", "failed"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="payload"
              placeholder='{"shipment_id":"123","status":"in_transit"}'
              className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Record Event
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Integration Registry
          </p>
          <div className="mt-5 space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <p className="font-semibold text-slate-900">{integration.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {integration.system_type} • {integration.mode} • {integration.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Webhook Events
          </p>
          <div className="mt-5 space-y-3">
            {webhookEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{event.event_type}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {event.direction} • {event.status}
                    </p>
                  </div>
                  <form action={retryWebhookEventAction}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
                      Replay
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          API Hub Reference
        </p>
        <p className="mt-3 text-sm text-slate-600">
          These workspace APIs are available for ERP, WMS, TMS, and middleware connectors.
          All endpoints require an authenticated user session.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Methods</th>
                <th className="px-4 py-3">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  endpoint: "/api/companies",
                  methods: "GET",
                  purpose: "Workspace company + hierarchy counts",
                },
                {
                  endpoint: "/api/users",
                  methods: "GET, PATCH",
                  purpose: "Current user profile + update profile",
                },
                {
                  endpoint: "/api/roles",
                  methods: "GET",
                  purpose: "Role and permission matrix",
                },
                {
                  endpoint: "/api/facilities",
                  methods: "GET",
                  purpose: "Facility catalog by company scope",
                },
                {
                  endpoint: "/api/shipments",
                  methods: "GET, POST",
                  purpose: "Shipment query + shipment creation",
                },
                {
                  endpoint: "/api/rates",
                  methods: "GET, POST",
                  purpose: "Rate card query + rate publishing",
                },
                {
                  endpoint: "/api/invoices",
                  methods: "GET, POST",
                  purpose: "Invoice query + invoice ingestion",
                },
              ].map((api) => (
                <tr key={api.endpoint} className="border-t border-slate-200/70 text-slate-700">
                  <td className="px-4 py-4 font-mono text-xs text-slate-900">{api.endpoint}</td>
                  <td className="px-4 py-4">{api.methods}</td>
                  <td className="px-4 py-4">{api.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
