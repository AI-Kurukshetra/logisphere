import {
  createRateQuoteAction,
  generateCodexRecommendationAction,
  generateForecastAction,
  saveBudgetPlanAction,
  selectRateOptionAction,
} from "@/app/(workspace)/intelligence/actions";
import { requireWorkspace } from "@/lib/supabase/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { company, permissions, supabase } = await requireWorkspace();
  const canManageBudget = permissions.includes("payments.manage");
  const canManageRates = permissions.includes("rates.manage");

  if (!canManageBudget && !canManageRates) {
    return null;
  }

  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");
  const fiscalYear = new Date().getFullYear();

  const [budgetsRes, forecastsRes, recommendationsRes, quotesRes, carriersRes, shipmentsRes] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, fiscal_year, total_budget, notes")
        .eq("company_id", company!.id)
        .order("fiscal_year", { ascending: false })
        .limit(5),
      supabase
        .from("forecasts")
        .select("id, algorithm, months, accuracy_score, status, created_at")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("optimization_recommendations")
        .select("id, title, summary, recommendation_type, estimated_savings, feasibility")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("rate_quotes")
        .select("id, origin_zone, destination_zone, service_type, weight_kg, expires_at, created_at")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("carriers").select("id, name").order("name"),
      supabase
        .from("shipments")
        .select("id, tracking_number")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const quotes = quotesRes.data ?? [];
  const quoteIds = quotes.map((quote) => quote.id);
  const quoteOptionsRes =
    quoteIds.length > 0
      ? await supabase
          .from("rate_quote_options")
          .select("id, quote_id, carrier_id, final_cost, recommendation, selected, performance_score")
          .in("quote_id", quoteIds)
          .order("ranking", { ascending: true })
      : { data: [] as Array<{
          carrier_id: string;
          final_cost: number | string;
          id: string;
          performance_score: number | string;
          quote_id: string;
          recommendation: string;
          selected: boolean;
        }> };

  const budgets = budgetsRes.data ?? [];
  const forecasts = forecastsRes.data ?? [];
  const recommendations = recommendationsRes.data ?? [];
  const carriers = carriersRes.data ?? [];
  const shipments = shipmentsRes.data ?? [];
  const quoteOptions = quoteOptionsRes.data ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#111827_0%,#0f766e_52%,#2563eb_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
          Intelligence
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Forecasting, optimization, and rate shopping
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

      <section className="grid gap-6 xl:grid-cols-3">
        {canManageBudget ? (
          <form
            action={saveBudgetPlanAction}
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Budget Plan
            </p>
            <div className="mt-5 grid gap-4">
              <input name="fiscalYear" defaultValue={String(fiscalYear)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="totalBudget" placeholder="250000" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              <div className="grid gap-4 md:grid-cols-3">
                <input name="baseCaseGrowth" placeholder="3" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
                <input name="bestCaseGrowth" placeholder="-5" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
                <input name="worstCaseGrowth" placeholder="12" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              </div>
              {carriers.slice(0, 3).map((carrier) => (
                <input
                  key={carrier.id}
                  name={`carrierBudget_${carrier.id}`}
                  placeholder={`${carrier.name} budget`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
                />
              ))}
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid gap-4 md:grid-cols-2">
                  <input
                    name={`laneLabel_${index}`}
                    placeholder="Chicago -> Dallas"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
                  />
                  <input
                    name={`laneBudget_${index}`}
                    placeholder="15000"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              ))}
              <textarea name="notes" placeholder="FY planning assumptions" className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Save Budget
              </button>
            </div>
          </form>
        ) : null}

        {canManageBudget ? (
          <form
            action={generateForecastAction}
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Forecast Engine
            </p>
            <div className="mt-5 grid gap-4">
              <input name="fiscalYear" defaultValue={String(fiscalYear)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="periods" defaultValue="12" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <input name="algorithm" defaultValue="linear_regression" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" />
              <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Generate Forecast
              </button>
            </div>
          </form>
        ) : null}

        {canManageRates ? (
          <form
            action={createRateQuoteAction}
            className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Rate Shopping
            </p>
            <div className="mt-5 grid gap-4">
              <select name="shipmentId" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white">
                <option value="">No linked shipment</option>
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.tracking_number}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="originZone" placeholder="Zone A" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
                <input name="destinationZone" placeholder="Zone B" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select name="serviceType" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white">
                  {["ground", "express", "overnight"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input name="weightKg" placeholder="120" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white" required />
              </div>
              <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Generate Quote
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {(canManageBudget || canManageRates) ? (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Codex AI Copilot
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Generate one actionable recommendation from your live workspace data using the Codex API.
          </p>
          <form action={generateCodexRecommendationAction} className="mt-5 grid gap-4">
            <textarea
              name="analysisPrompt"
              placeholder="Example: Identify one high-impact way to reduce freight spend next month while keeping service levels stable."
              className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white"
              required
            />
            <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Generate AI Recommendation
            </button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Budgets & Forecasts
            </p>
            <div className="mt-5 space-y-3">
              {budgets.map((budget) => (
                <div key={budget.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">FY{budget.fiscal_year}</p>
                  <p className="mt-1 text-sm text-slate-600">Budget {budget.total_budget}</p>
                </div>
              ))}
              {forecasts.map((forecast) => (
                <div key={forecast.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{forecast.algorithm}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {forecast.months} months • accuracy {forecast.accuracy_score}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Optimization Recommendations
            </p>
            <div className="mt-5 space-y-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{recommendation.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{recommendation.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Rate Quote Options
          </p>
          <div className="mt-5 space-y-4">
            {quotes.map((quote) => {
              const options = quoteOptions.filter((option) => option.quote_id === quote.id);
              return (
                <div key={quote.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {quote.origin_zone} to {quote.destination_zone}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {quote.service_type} • {quote.weight_kg}kg
                  </p>
                  <div className="mt-4 space-y-2">
                    {options.map((option) => {
                      const carrier = carriers.find((item) => item.id === option.carrier_id);
                      return (
                        <form key={option.id} action={selectRateOptionAction} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3">
                          <input type="hidden" name="quoteId" value={quote.id} />
                          <input type="hidden" name="optionId" value={option.id} />
                          <div>
                            <p className="font-semibold text-slate-900">{carrier?.name || option.carrier_id}</p>
                            <p className="text-sm text-slate-600">
                              {option.recommendation} • {option.final_cost}
                            </p>
                          </div>
                          <button className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
                            {option.selected ? "Selected" : "Select"}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
