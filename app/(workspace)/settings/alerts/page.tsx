import {
  createAlertRuleAction,
  updateAlertRuleAction,
  deleteAlertRuleAction,
  evaluateAlertRulesAction,
} from "@/app/(workspace)/settings/alerts/actions";
import { requirePermission } from "@/lib/supabase/session";
import type { AlertRuleType } from "@/types/database";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function getThresholdLabel(type: AlertRuleType): string {
  switch (type) {
    case "cost_overrun":
      return "Overrun Threshold (%)";
    case "service_failure":
      return "Min On-Time Rate (%)";
    case "invoice_exception":
      return "Max Exception Count";
    case "payment_delay":
      return "Days Overdue";
    case "carrier_sla":
      return "SLA Gap (%)";
    default:
      return "Threshold";
  }
}

function titleize(str: string): string {
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AlertSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, supabase } = await requirePermission("alerts.manage");
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  const { data: rules } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("company_id", company!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#132238_0%,#0f172a_100%)] p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">
          Alert Configuration
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Manage alert rules for {company?.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Set up automated alerts for cost overruns, service failures, exceptions,
          payment delays, and SLA breaches. Define thresholds and choose notification
          channels.
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

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Create New Alert Rule
        </p>

        <form action={createAlertRuleAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              type="text"
              placeholder="Rule name (e.g., 'High Freight Costs')"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            />

            <select
              name="type"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            >
              <option value="">Select alert type...</option>
              <option value="cost_overrun">Cost Overrun</option>
              <option value="service_failure">Service Failure</option>
              <option value="invoice_exception">Invoice Exception</option>
              <option value="payment_delay">Payment Delay</option>
              <option value="carrier_sla">Carrier SLA</option>
            </select>

            <input
              name="threshold"
              type="number"
              step="0.01"
              placeholder="Threshold value"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white"
              required
            />

            <div className="flex gap-2">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm cursor-pointer transition hover:bg-slate-100">
                <input
                  name="channels"
                  type="checkbox"
                  value="in_app"
                  defaultChecked
                  className="rounded"
                />
                In-App
              </label>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm cursor-pointer transition hover:bg-slate-100">
                <input
                  name="channels"
                  type="checkbox"
                  value="email"
                  className="rounded"
                />
                Email
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Create Alert Rule
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Active Rules ({rules?.length ?? 0})
          </p>

          <form action={evaluateAlertRulesAction}>
            <button
              type="submit"
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Run Evaluation Now
            </button>
          </form>
        </div>

        {(rules ?? []).length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">No alert rules configured yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {(rules ?? []).map((rule: any) => (
              <div
                key={rule.id}
                className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {rule.name}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {titleize(rule.type)}
                      </span>

                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Threshold: {rule.threshold}
                      </span>

                      {rule.channels?.map((channel: string) => (
                        <span
                          key={channel}
                          className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {titleize(channel)}
                        </span>
                      ))}

                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          rule.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <form action={updateAlertRuleAction} className="flex gap-2">
                      <input type="hidden" name="ruleId" value={rule.id} />
                      <input type="hidden" name="name" value={rule.name} />
                      <input type="hidden" name="type" value={rule.type} />
                      <input type="hidden" name="threshold" value={rule.threshold} />
                      <input type="hidden" name="enabled" value={(!rule.enabled).toString()} />
                      {rule.channels?.map((channel: string) => (
                        <input
                          key={channel}
                          type="hidden"
                          name="channels"
                          value={channel}
                        />
                      ))}

                      <button
                        type="submit"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {rule.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>

                    <form action={deleteAlertRuleAction}>
                      <input type="hidden" name="ruleId" value={rule.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                        onClick={(e) => {
                          if (!window.confirm("Are you sure you want to delete this rule?")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
