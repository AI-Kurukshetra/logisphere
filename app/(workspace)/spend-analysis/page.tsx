import { SpendTrendChart } from "@/app/_components/spend-trend-chart";
import { CarrierSpendChart } from "@/app/_components/carrier-spend-chart";
import { BudgetVsActualChart } from "@/app/_components/budget-vs-actual-chart";
import { requirePermission } from "@/lib/supabase/session";
import { fetchPredictiveForecast } from "@/lib/predictive-api";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

type SpendData = {
  byCarrier: Array<{ carrier_id: string; carrier_name: string; amount: number }>;
  byLane: Array<{ lane: string; amount: number }>;
  byMonth: Array<{ period: string; amount: number }>;
};

type RecommendationRow = {
  id: string;
  title: string;
  summary: string | null;
  feasibility: string;
  impact_score: number;
  estimated_savings: number;
  savings_percent: number;
};

export default async function SpendAnalysisPage() {
  const { company, profile, supabase } = await requirePermission("audit.read");
  const companyId = company!.id;

  // Fetch historical spend data
  const spendRes = await fetch("http://localhost:3000/api/spend-analysis", {
    cache: "no-store",
  }).catch(() => null);

  const spendData: SpendData = spendRes?.ok
    ? await spendRes.json().then((r) => r.data || { byCarrier: [], byLane: [], byMonth: [] })
    : { byCarrier: [], byLane: [], byMonth: [] };

  // Fetch forecast data
  const forecastRes = await fetch("http://localhost:3000/api/spend-analysis/forecast", {
    cache: "no-store",
  }).catch(() => null);

  const forecastData = forecastRes?.ok
    ? await forecastRes.json()
    : {
        accuracy_score: 0,
        forecast: [],
        history: [] as Array<{ period: string; amount: number }>,
        source: "linear_regression" as "codex_api" | "linear_regression",
      };

  // Fetch budget vs actual
  const currentYear = new Date().getFullYear();
  const bvaRes = await fetch(
    `http://localhost:3000/api/spend-analysis/budget-vs-actual?fiscal_year=${currentYear}`,
    {
      cache: "no-store",
    }
  ).catch(() => null);

  const bvaData = bvaRes?.ok ? await bvaRes.json().then((r) => r.data || []) : [];

  // Fetch budgets and recommendations
  const [budgetRes, recommendationsRes] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, total_budget, fiscal_year")
      .eq("company_id", companyId)
      .eq("fiscal_year", currentYear)
      .maybeSingle(),
    supabase
      .from("optimization_recommendations")
      .select("id, title, summary, feasibility, impact_score, estimated_savings, savings_percent")
      .eq("company_id", companyId)
      .order("impact_score", { ascending: false })
      .limit(5),
  ]);

  const budget = budgetRes.data;
  const recommendations = (recommendationsRes.data ?? []) as RecommendationRow[];

  // Calculate KPIs
  const totalSpend = spendData.byMonth.reduce((sum, m) => sum + m.amount, 0);
  const avgMonthlySpend = spendData.byMonth.length > 0 ? totalSpend / spendData.byMonth.length : 0;
  const topCarrierSpend = spendData.byCarrier[0]?.amount ?? 0;
  const topCarrierPercent = totalSpend > 0 ? (topCarrierSpend / totalSpend) * 100 : 0;

  const projectedSpend = forecastData.forecast.reduce(
    (sum: number, f: any) => sum + (f.forecast || 0),
    0
  );
  const budgetVar = budget ? projectedSpend - Number(budget.total_budget) : 0;
  const budgetVarPercent = budget ? (budgetVar / Number(budget.total_budget)) * 100 : 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Spend Analysis</h1>
        <p className="text-slate-600 mt-1">
          Historical trends, predictive forecasts, and budget reconciliation
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-slate-600 font-medium">Total Spend</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(totalSpend)}</div>
          <div className="text-xs text-slate-500 mt-2">
            Avg/mo: {formatCurrency(avgMonthlySpend)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-slate-600 font-medium">Top Carrier</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {spendData.byCarrier[0]?.carrier_name || "—"}
          </div>
          <div className="text-xs text-slate-500 mt-2">{formatPercent(topCarrierPercent)} of total</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-slate-600 font-medium">Forecast (12mo)</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(projectedSpend)}</div>
          <div
            className={`text-xs mt-2 ${budgetVar > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {budget ? (budgetVar > 0 ? "+" : "") + formatCurrency(budgetVar) : "—"}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm text-slate-600 font-medium">Budget Status</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {budget ? formatCurrency(Number(budget.total_budget)) : "—"}
          </div>
          <div
            className={`text-xs mt-2 ${budgetVarPercent > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {budget ? (budgetVarPercent > 0 ? "+" : "") + formatPercent(budgetVarPercent) : "No budget set"}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendTrendChart
            data={forecastData.history || spendData.byMonth}
            forecast={forecastData.forecast}
            source={forecastData.source}
          />
        </div>
        <div>
          <CarrierSpendChart data={spendData.byCarrier} />
        </div>
      </div>

      {/* Budget vs Actual */}
      <div>
        <BudgetVsActualChart data={bvaData} fiscalYear={currentYear} />
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Optimization Recommendations</h3>
        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>No recommendations available yet. Generate a forecast to see optimization opportunities.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{rec.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{rec.summary}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {rec.feasibility}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Impact: {rec.impact_score.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-slate-900">
                    {formatCurrency(rec.estimated_savings)}
                  </div>
                  <div className="text-xs text-slate-600">{formatPercent(rec.savings_percent)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
