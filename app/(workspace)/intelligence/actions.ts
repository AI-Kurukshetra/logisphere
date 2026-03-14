"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/supabase/session";
import { logActivity } from "@/lib/workspace-admin";

const INTELLIGENCE_PATH = "/intelligence";
const FORECAST_RECOMMENDATION_TYPES = [
  "budget_guardrail",
  "carrier_budget_gap",
  "lane_variance",
  "carrier_rebalance",
] as const;

type InvoiceRow = {
  amount: number | string;
  carrier_id: string;
  created_at: string;
  shipment_id: string | null;
};

type ShipmentRow = {
  carrier_id: string;
  dest_facility_id: string | null;
  id: string;
  origin_facility_id: string | null;
};

type FacilityRow = {
  id: string;
  name: string;
};

type CarrierRow = {
  id: string;
  name: string;
  status?: string;
};

type RateRow = {
  carrier_id: string;
  contract_id: string | null;
  dest_zone: string | null;
  effective_from: string;
  effective_to: string | null;
  id: string;
  origin_zone: string | null;
  rate_amount: number | string;
  weight_kg_max: number | string | null;
  weight_kg_min: number | string | null;
};

type ContractRow = {
  carrier_id: string;
  id: string;
  name: string | null;
  sla: unknown;
};

type PerformanceMetricRow = {
  carrier_id: string;
  on_time_rate: number | string | null;
  period_end: string;
  score: number | string | null;
};

type ForecastPoint = {
  confidence_80: number;
  confidence_95: number;
  forecast: number;
  period: string;
};

type CodexResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: number | string | null | undefined) {
  const normalized = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(normalized) ? Number(normalized) : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function redirectWithStatus(
  kind: "error" | "message",
  message: string
): never {
  redirect(`${INTELLIGENCE_PATH}?${kind}=${encodeURIComponent(message)}`);
}

function readCodexText(payload: CodexResponse) {
  if (payload.output_text && payload.output_text.trim().length > 0) {
    return payload.output_text.trim();
  }

  for (const block of payload.output ?? []) {
    for (const content of block.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
}

function toPeriodKey(dateValue: string) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlyHistory(invoices: InvoiceRow[], months: number) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      amount: 0,
      period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.period, bucket]));

  for (const invoice of invoices) {
    const period = toPeriodKey(invoice.created_at);
    const bucket = bucketMap.get(period);
    if (bucket) {
      bucket.amount += toNumber(invoice.amount);
    }
  }

  return buckets;
}

function buildForecastModel(history: Array<{ amount: number; period: string }>, periods: number) {
  const values = history.map((point) => point.amount);
  const count = values.length;

  if (count === 0) {
    return {
      accuracyScore: 0,
      forecastData: [] as ForecastPoint[],
      scenarioData: [] as Array<{ adjustment_percent: number; label: string; total: number }>,
    };
  }

  const xValues = values.map((_, index) => index);
  const xMean = xValues.reduce((sum, value) => sum + value, 0) / count;
  const yMean = values.reduce((sum, value) => sum + value, 0) / count;

  const numerator = xValues.reduce(
    (sum, xValue, index) => sum + (xValue - xMean) * (values[index] - yMean),
    0
  );
  const denominator = xValues.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const fitted = values.map((_, index) => intercept + slope * index);
  const residuals = values.map((value, index) => value - fitted[index]);
  const mse =
    residuals.reduce((sum, residual) => sum + residual ** 2, 0) / Math.max(residuals.length, 1);
  const rmse = Math.sqrt(mse);
  const baseline = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  const mape =
    values.reduce((sum, value, index) => {
      if (value <= 0) return sum;
      return sum + Math.abs((value - fitted[index]) / value);
    }, 0) / Math.max(values.filter((value) => value > 0).length, 1);

  const accuracyScore = clamp(Math.round((1 - Math.min(mape, 1)) * 100), 0, 99);
  const standardDeviation =
    residuals.length > 0
      ? Math.sqrt(
          residuals.reduce((sum, residual) => sum + (residual - rmse) ** 2, 0) /
            residuals.length
        )
      : baseline * 0.08;

  const lastPeriod = history[history.length - 1]?.period ?? toPeriodKey(new Date().toISOString());
  const [startYear, startMonth] = lastPeriod.split("-").map(Number);
  const startDate = new Date(startYear, (startMonth || 1) - 1 + 1, 1);

  const forecastData = Array.from({ length: periods }, (_, index) => {
    const nextDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
    const forecast = Math.max(0, intercept + slope * (count + index));

    return {
      confidence_80: Math.max(forecast * 0.7, forecast + standardDeviation * 1.28),
      confidence_95: Math.max(forecast * 0.65, forecast + standardDeviation * 1.96),
      forecast: Math.round(forecast),
      period: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`,
    };
  });

  const total = forecastData.reduce((sum, point) => sum + point.forecast, 0);
  const scenarioData = [
    { adjustment_percent: -10, label: "Best case", total: Math.round(total * 0.9) },
    { adjustment_percent: 3, label: "Base case", total: Math.round(total * 1.03) },
    { adjustment_percent: 15, label: "Worst case", total: Math.round(total * 1.15) },
  ];

  return {
    accuracyScore,
    forecastData,
    scenarioData,
  };
}

function buildLaneKey(
  shipmentId: string | null,
  shipmentMap: Map<string, ShipmentRow>,
  facilityMap: Map<string, string>
) {
  if (!shipmentId) return "Unassigned lane";
  const shipment = shipmentMap.get(shipmentId);
  if (!shipment) return "Unassigned lane";

  const origin = shipment.origin_facility_id
    ? facilityMap.get(shipment.origin_facility_id)
    : null;
  const destination = shipment.dest_facility_id
    ? facilityMap.get(shipment.dest_facility_id)
    : null;

  return `${origin || "Origin TBD"} -> ${destination || "Destination TBD"}`;
}

function extractDiscountPercent(sla: unknown) {
  if (!sla || typeof sla !== "object" || Array.isArray(sla)) {
    return 0;
  }

  const value = (sla as Record<string, unknown>).discount_percent;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function matchRateToRequest(
  rates: RateRow[],
  request: {
    destinationZone: string;
    originZone: string;
    weightKg: number;
  }
) {
  const matches = rates
    .filter((rate) => {
      const originMatches =
        !rate.origin_zone ||
        rate.origin_zone.toLowerCase() === request.originZone.toLowerCase();
      const destinationMatches =
        !rate.dest_zone ||
        rate.dest_zone.toLowerCase() === request.destinationZone.toLowerCase();
      const min = toNumber(rate.weight_kg_min);
      const max = rate.weight_kg_max == null ? Number.POSITIVE_INFINITY : toNumber(rate.weight_kg_max);
      const weightMatches = request.weightKg >= min && request.weightKg <= max;

      return originMatches && destinationMatches && weightMatches;
    })
    .sort((left, right) => {
      const leftScore =
        Number(Boolean(left.origin_zone)) +
        Number(Boolean(left.dest_zone)) +
        Number(left.weight_kg_min != null) +
        Number(left.weight_kg_max != null);
      const rightScore =
        Number(Boolean(right.origin_zone)) +
        Number(Boolean(right.dest_zone)) +
        Number(right.weight_kg_min != null) +
        Number(right.weight_kg_max != null);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return toNumber(left.rate_amount) - toNumber(right.rate_amount);
    });

  return matches[0] ?? null;
}

export async function saveBudgetPlanAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("payments.manage");
  const fiscalYear = Number(getValue(formData, "fiscalYear")) || new Date().getFullYear();
  const totalBudget = toNumber(getValue(formData, "totalBudget"));
  const notes = getValue(formData, "notes");
  const scenarioAssumptions = {
    base_case_growth: toNumber(getValue(formData, "baseCaseGrowth")),
    best_case_growth: toNumber(getValue(formData, "bestCaseGrowth")),
    worst_case_growth: toNumber(getValue(formData, "worstCaseGrowth")),
  };

  if (!totalBudget) {
    redirectWithStatus("error", "Total budget is required.");
  }

  const budgetByCarrier: Record<string, number> = {};
  const budgetByLane: Record<string, number> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;

    if (key.startsWith("carrierBudget_")) {
      const carrierId = key.replace("carrierBudget_", "");
      const amount = toNumber(value);
      if (carrierId && amount > 0) {
        budgetByCarrier[carrierId] = amount;
      }
    }
  }

  for (let index = 0; index < 3; index += 1) {
    const laneLabel = getValue(formData, `laneLabel_${index}`);
    const laneBudget = toNumber(getValue(formData, `laneBudget_${index}`));

    if (laneLabel && laneBudget > 0) {
      budgetByLane[laneLabel] = laneBudget;
    }
  }

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        budget_by_carrier: budgetByCarrier,
        budget_by_lane: budgetByLane,
        company_id: company!.id,
        created_by: profile!.id,
        fiscal_year: fiscalYear,
        notes: notes || null,
        scenario_assumptions: scenarioAssumptions,
        total_budget: totalBudget,
      },
      { onConflict: "company_id,fiscal_year" }
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    redirectWithStatus("error", "Unable to save the budget plan.");
  }

  const budgetId = String(data.id);

  await logActivity(supabase, {
    action: "intelligence.budget.saved",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: budgetId,
    entityType: "budget",
    metadata: {
      carrier_budget_count: Object.keys(budgetByCarrier).length,
      fiscal_year: fiscalYear,
      lane_budget_count: Object.keys(budgetByLane).length,
      total_budget: totalBudget,
    },
    summary: `Saved budget plan for FY${fiscalYear}.`,
  });

  revalidatePath(INTELLIGENCE_PATH);
  redirectWithStatus("message", "Budget plan saved.");
}

export async function generateForecastAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("payments.manage");
  const fiscalYear = Number(getValue(formData, "fiscalYear")) || new Date().getFullYear();
  const periods = clamp(Number(getValue(formData, "periods")) || 12, 3, 24);
  const algorithm = getValue(formData, "algorithm") || "linear_regression";

  const [budgetRes, invoicesRes, shipmentsRes, facilitiesRes, carriersRes, ratesRes] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, total_budget, budget_by_carrier, budget_by_lane")
        .eq("company_id", company!.id)
        .eq("fiscal_year", fiscalYear)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("amount, carrier_id, created_at, shipment_id")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("shipments")
        .select("id, carrier_id, origin_facility_id, dest_facility_id")
        .eq("company_id", company!.id),
      supabase.from("facilities").select("id, name").eq("company_id", company!.id),
      supabase.from("carriers").select("id, name").order("name"),
      supabase
        .from("rates")
        .select("carrier_id, origin_zone, dest_zone, rate_amount")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
  if (invoices.length === 0) {
    redirectWithStatus("error", "Forecast generation needs invoice history.");
  }

  const budget = budgetRes.data as
    | {
        budget_by_carrier: Record<string, number> | null;
        budget_by_lane: Record<string, number> | null;
        id: string;
        total_budget: number | string;
      }
    | null;
  const carriers = (carriersRes.data ?? []) as CarrierRow[];
  const shipments = (shipmentsRes.data ?? []) as ShipmentRow[];
  const facilities = (facilitiesRes.data ?? []) as FacilityRow[];
  const rates = (ratesRes.data ?? []) as Array<{
    carrier_id: string;
    dest_zone: string | null;
    origin_zone: string | null;
    rate_amount: number | string;
  }>;

  const monthlyHistory = buildMonthlyHistory(invoices, 12);
  const { accuracyScore, forecastData, scenarioData } = buildForecastModel(monthlyHistory, periods);

  const firstPeriod = forecastData[0]?.period ?? `${fiscalYear}-01`;
  const [startYear, startMonth] = firstPeriod.split("-").map(Number);

  const { data: forecastRecord, error: forecastError } = await supabase
    .from("forecasts")
    .insert({
      accuracy_score: accuracyScore,
      algorithm,
      budget_id: budget?.id ?? null,
      company_id: company!.id,
      created_by: profile!.id,
      forecast_data: forecastData,
      forecast_period: "monthly",
      months: periods,
      scenario_data: scenarioData,
      start_month: startMonth || 1,
      start_year: startYear || fiscalYear,
      status: "completed",
    })
    .select("id")
    .single();

  if (forecastError || !forecastRecord) {
    redirectWithStatus("error", "Unable to store the forecast.");
  }

  const forecastId = String(forecastRecord.id);

  await supabase
    .from("budget_vs_actual")
    .delete()
    .eq("company_id", company!.id)
    .eq("fiscal_year", fiscalYear);

  const monthlyBudget = budget ? toNumber(budget.total_budget) / 12 : 0;
  const actualByMonth = new Map<number, number>();

  for (const invoice of invoices) {
    const createdAt = new Date(invoice.created_at);
    if (createdAt.getFullYear() !== fiscalYear) continue;
    actualByMonth.set(
      createdAt.getMonth() + 1,
      (actualByMonth.get(createdAt.getMonth() + 1) ?? 0) + toNumber(invoice.amount)
    );
  }

  const varianceRows = Array.from({ length: 12 }, (_, index) => {
    const fiscalMonth = index + 1;
    const actualAmount = Math.round(actualByMonth.get(fiscalMonth) ?? 0);
    const budgetAmount = Math.round(monthlyBudget);
    const variance = Math.round(actualAmount - budgetAmount);
    const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

    return {
      actual_amount: actualAmount,
      budget_amount: budgetAmount,
      budget_id: budget?.id ?? null,
      company_id: company!.id,
      created_at: new Date().toISOString(),
      fiscal_month: fiscalMonth,
      fiscal_year: fiscalYear,
      metadata: {},
      variance,
      variance_percent: Number(variancePercent.toFixed(2)),
    };
  });

  if (varianceRows.length > 0) {
    await supabase.from("budget_vs_actual").insert(varianceRows);
  }

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const shipmentMap = new Map(shipments.map((shipment) => [shipment.id, shipment]));
  const carrierMap = new Map(carriers.map((carrier) => [carrier.id, carrier.name]));
  const carrierSpend = new Map<string, number>();
  const laneSpend = new Map<string, number>();

  for (const invoice of invoices) {
    const amount = toNumber(invoice.amount);
    carrierSpend.set(invoice.carrier_id, (carrierSpend.get(invoice.carrier_id) ?? 0) + amount);

    const laneKey = buildLaneKey(invoice.shipment_id, shipmentMap, facilityMap);
    laneSpend.set(laneKey, (laneSpend.get(laneKey) ?? 0) + amount);
  }

  const recommendations: Array<Record<string, unknown>> = [];
  const projectedSpend = forecastData.reduce((sum, point) => sum + point.forecast, 0);
  const totalBudget = budget ? toNumber(budget.total_budget) : 0;

  if (totalBudget > 0 && projectedSpend > totalBudget) {
    recommendations.push({
      company_id: company!.id,
      created_by: profile!.id,
      estimated_savings: projectedSpend - totalBudget,
      feasibility: "high",
      impact_score: Math.min(99, ((projectedSpend - totalBudget) / totalBudget) * 100),
      recommendation_type: "budget_guardrail",
      savings_percent: totalBudget > 0 ? ((projectedSpend - totalBudget) / totalBudget) * 100 : 0,
      summary:
        "Forecasted spend is above the annual plan. Consolidate lower-yield lanes and shift routine volume to lower-cost carriers.",
      supporting_data: {
        budget: totalBudget,
        projected_spend: projectedSpend,
      },
      title: `Projected spend is ${Math.round(projectedSpend - totalBudget)} over budget`,
    });
  }

  const carrierBudgets = budget?.budget_by_carrier ?? {};
  for (const [carrierId, amount] of Object.entries(carrierBudgets)) {
    const actual = carrierSpend.get(carrierId) ?? 0;
    const target = toNumber(amount);
    if (target <= 0 || actual <= target) continue;

    recommendations.push({
      carrier_id: carrierId,
      company_id: company!.id,
      created_by: profile!.id,
      estimated_savings: actual - target,
      feasibility: "medium",
      impact_score: Math.min(99, ((actual - target) / target) * 100),
      recommendation_type: "carrier_budget_gap",
      savings_percent: ((actual - target) / target) * 100,
      summary: `${carrierMap.get(carrierId) || "Carrier"} is outpacing its budget allocation. Review service mix and negotiate contract relief.`,
      supporting_data: {
        actual_spend: actual,
        budget_amount: target,
      },
      title: `${carrierMap.get(carrierId) || "Carrier"} is above its allocation`,
    });
  }

  const laneBudgets = budget?.budget_by_lane ?? {};
  for (const [laneKey, amount] of Object.entries(laneBudgets)) {
    const actual = laneSpend.get(laneKey) ?? 0;
    const target = toNumber(amount);
    if (target <= 0 || actual <= target) continue;

    recommendations.push({
      company_id: company!.id,
      created_by: profile!.id,
      estimated_savings: actual - target,
      feasibility: "high",
      impact_score: Math.min(99, ((actual - target) / target) * 100),
      lane_key: laneKey,
      recommendation_type: "lane_variance",
      savings_percent: ((actual - target) / target) * 100,
      summary: `${laneKey} is running ahead of budget. Consolidate weekly volume or route to a backup carrier for lower-cost coverage.`,
      supporting_data: {
        actual_spend: actual,
        budget_amount: target,
      },
      title: `${laneKey} is overspending its lane budget`,
    });
  }

  const rateSpreadByLane = new Map<
    string,
    { baseline: number; premium: number; carriers: string[] }
  >();
  for (const rate of rates) {
    const key = `${rate.origin_zone || "Any"} -> ${rate.dest_zone || "Any"}`;
    const current = rateSpreadByLane.get(key);
    const amount = toNumber(rate.rate_amount);
    const carrierName = carrierMap.get(rate.carrier_id) || "Carrier";
    if (!current) {
      rateSpreadByLane.set(key, {
        baseline: amount,
        carriers: [carrierName],
        premium: amount,
      });
      continue;
    }

    current.baseline = Math.min(current.baseline, amount);
    current.premium = Math.max(current.premium, amount);
    current.carriers.push(carrierName);
  }

  const widestSpread = Array.from(rateSpreadByLane.entries())
    .map(([laneKey, value]) => ({
      carriers: value.carriers,
      laneKey,
      spread: value.premium - value.baseline,
    }))
    .sort((left, right) => right.spread - left.spread)[0];

  if (widestSpread && widestSpread.spread > 0) {
    recommendations.push({
      company_id: company!.id,
      created_by: profile!.id,
      estimated_savings: widestSpread.spread,
      feasibility: "medium",
      impact_score: 64,
      lane_key: widestSpread.laneKey,
      recommendation_type: "carrier_rebalance",
      savings_percent: 0,
      summary: `${widestSpread.laneKey} has the widest active rate spread. Set it up as a rate-shopping priority lane for quick savings.`,
      supporting_data: {
        carriers: widestSpread.carriers,
        rate_spread: widestSpread.spread,
      },
      title: `Rebalance carrier mix on ${widestSpread.laneKey}`,
    });
  }

  await supabase
    .from("optimization_recommendations")
    .delete()
    .eq("company_id", company!.id)
    .in("recommendation_type", [...FORECAST_RECOMMENDATION_TYPES]);

  if (recommendations.length > 0) {
    await supabase.from("optimization_recommendations").insert(recommendations.slice(0, 6));
  }

  await logActivity(supabase, {
    action: "intelligence.forecast.generated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: forecastId,
    entityType: "forecast",
    metadata: {
      accuracy_score: accuracyScore,
      algorithm,
      periods,
    },
    summary: `Generated ${periods}-month spend forecast.`,
  });

  revalidatePath(INTELLIGENCE_PATH);
  redirectWithStatus("message", "Forecast generated.");
}

export async function createRateQuoteAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("rates.manage");
  const shipmentId = getValue(formData, "shipmentId");
  const originZone = getValue(formData, "originZone");
  const destinationZone = getValue(formData, "destinationZone");
  const serviceType = getValue(formData, "serviceType") || "ground";
  const weightKg = toNumber(getValue(formData, "weightKg"));

  if (!originZone || !destinationZone || !weightKg) {
    redirectWithStatus("error", "Origin, destination, and weight are required for rate shopping.");
  }

  const [carriersRes, ratesRes, contractsRes, performanceMetricsRes] = await Promise.all([
    supabase.from("carriers").select("id, name, status").eq("status", "active").order("name"),
    supabase
      .from("rates")
      .select(
        "id, carrier_id, contract_id, origin_zone, dest_zone, weight_kg_min, weight_kg_max, rate_amount, effective_from, effective_to"
      )
      .order("effective_from", { ascending: false }),
    supabase.from("contracts").select("id, carrier_id, name, sla").eq("company_id", company!.id),
    supabase
      .from("performance_metrics")
      .select("carrier_id, score, on_time_rate, period_end")
      .eq("company_id", company!.id)
      .order("period_end", { ascending: false }),
  ]);

  const carriers = (carriersRes.data ?? []) as CarrierRow[];
  const rates = (ratesRes.data ?? []) as RateRow[];
  const contracts = (contractsRes.data ?? []) as ContractRow[];
  const performanceMetrics = (performanceMetricsRes.data ?? []) as PerformanceMetricRow[];

  const latestMetricByCarrier = new Map<string, PerformanceMetricRow>();
  for (const metric of performanceMetrics) {
    if (!latestMetricByCarrier.has(metric.carrier_id)) {
      latestMetricByCarrier.set(metric.carrier_id, metric);
    }
  }

  const now = new Date();
  const activeRates = rates.filter((rate) => {
    const startsAt = new Date(rate.effective_from);
    const endsAt = rate.effective_to ? new Date(rate.effective_to) : null;
    if (Number.isNaN(startsAt.getTime())) return false;
    if (startsAt > now) return false;
    if (endsAt && endsAt < now) return false;
    return true;
  });

  const options = carriers
    .map((carrier) => {
      const matchedRate = matchRateToRequest(
        activeRates.filter((rate) => rate.carrier_id === carrier.id),
        {
          destinationZone,
          originZone,
          weightKg,
        }
      );

      if (!matchedRate) return null;

      const contract =
        contracts.find((item) => item.id === matchedRate.contract_id) ??
        contracts.find((item) => item.carrier_id === carrier.id) ??
        null;
      const discountPercent = extractDiscountPercent(contract?.sla);
      const baseRate = toNumber(matchedRate.rate_amount);
      const accessorialCharges =
        (serviceType === "ground" ? 6 : serviceType === "express" ? 18 : 32) +
        Math.max(0, Math.round((weightKg - 75) * 0.1));
      const totalCost = baseRate + accessorialCharges;
      const finalCost = totalCost * (1 - discountPercent / 100);
      const metric = latestMetricByCarrier.get(carrier.id);
      const performanceScore = metric ? Math.max(3.5, toNumber(metric.score) / 20) : 4.2;
      const estimatedDeliveryDays =
        serviceType === "overnight" ? 1 : serviceType === "express" ? 2 : 3;

      return {
        baseRate,
        carrierId: carrier.id,
        contractId: contract?.id ?? null,
        discountPercent,
        estimatedDeliveryDate: new Date(
          now.getTime() + estimatedDeliveryDays * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
        estimatedDeliveryDays,
        finalCost,
        matchedRate,
        performanceScore,
        totalCost,
      };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((left, right) => {
      if (left.finalCost !== right.finalCost) {
        return left.finalCost - right.finalCost;
      }
      return right.performanceScore - left.performanceScore;
    });

  if (options.length === 0) {
    redirectWithStatus("error", "No active rates matched that lane and weight range.");
  }

  const { data: quoteRecord, error: quoteError } = await supabase
    .from("rate_quotes")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      destination_zone: destinationZone,
      expires_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      origin_zone: originZone,
      service_type: serviceType,
      shipment_id: shipmentId || null,
      weight_kg: weightKg,
    })
    .select("id")
    .single();

  if (quoteError || !quoteRecord) {
    redirectWithStatus("error", "Unable to create the quote request.");
  }

  const quoteId = quoteRecord.id;

  const bestServiceCarrierId = [...options].sort(
    (left, right) => right.performanceScore - left.performanceScore
  )[0]?.carrierId;

  const optionRows = options.map((option, index) => ({
    accessorial_charges: Number(option.totalCost - option.baseRate),
    base_rate: Number(option.baseRate.toFixed(2)),
    carrier_id: option.carrierId,
    contract_discount_percent: Number(option.discountPercent.toFixed(2)),
    contract_id: option.contractId,
    details: {
      input_weight_kg: weightKg,
      service_type: serviceType,
    },
    estimated_delivery_date: option.estimatedDeliveryDate,
    estimated_delivery_days: option.estimatedDeliveryDays,
    final_cost: Number(option.finalCost.toFixed(2)),
    performance_score: Number(option.performanceScore.toFixed(2)),
    quote_id: quoteId,
    ranking: index + 1,
    rate_id: option.matchedRate.id,
    recommendation:
      index === 0
        ? "best_price"
        : option.carrierId === bestServiceCarrierId
          ? "best_service"
          : "balanced",
    selected: index === 0,
    total_cost: Number(option.totalCost.toFixed(2)),
  }));

  const { error: optionError } = await supabase.from("rate_quote_options").insert(optionRows);

  if (optionError) {
    redirectWithStatus("error", "Quote created, but options failed to save.");
  }

  await logActivity(supabase, {
    action: "intelligence.rate_quote.generated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: String(quoteId),
    entityType: "rate_quote",
    metadata: {
      destination_zone: destinationZone,
      option_count: optionRows.length,
      origin_zone: originZone,
      service_type: serviceType,
      weight_kg: weightKg,
    },
    summary: `Generated ${optionRows.length} rate options for ${originZone} to ${destinationZone}.`,
  });

  revalidatePath(INTELLIGENCE_PATH);
  redirectWithStatus("message", "Rate options generated.");
}

export async function selectRateOptionAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("rates.manage");
  const quoteId = getValue(formData, "quoteId");
  const optionId = getValue(formData, "optionId");

  if (!quoteId || !optionId) {
    redirectWithStatus("error", "Quote option selection is incomplete.");
  }

  const { data: quote } = await supabase
    .from("rate_quotes")
    .select("id")
    .eq("id", quoteId)
    .eq("company_id", company!.id)
    .maybeSingle();

  if (!quote) {
    redirectWithStatus("error", "That quote is not available.");
  }

  await supabase.from("rate_quote_options").update({ selected: false }).eq("quote_id", quoteId);
  const { error } = await supabase
    .from("rate_quote_options")
    .update({ selected: true })
    .eq("id", optionId)
    .eq("quote_id", quoteId);

  if (error) {
    redirectWithStatus("error", "Unable to select that option.");
  }

  await logActivity(supabase, {
    action: "intelligence.rate_quote.selected",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: optionId,
    entityType: "rate_quote_option",
    metadata: { quote_id: quoteId },
    summary: `Selected quote option ${optionId}.`,
  });

  revalidatePath(INTELLIGENCE_PATH);
  redirectWithStatus("message", "Rate option selected.");
}

export async function generateCodexRecommendationAction(formData: FormData) {
  const { company, profile, supabase } = await requirePermission("audit.read");
  const analysisPrompt = getValue(formData, "analysisPrompt");

  if (!analysisPrompt) {
    redirectWithStatus("error", "Prompt is required for AI analysis.");
  }

  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    redirectWithStatus("error", "OPENAI_API_KEY is not configured.");
  }

  const [invoicesRes, shipmentsRes, carriersRes, exceptionsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("amount, status, approval_status, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("shipments")
      .select("status, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("carriers")
      .select("id, name, status")
      .order("name")
      .limit(60),
    supabase
      .from("exceptions")
      .select("severity, status, category, created_at")
      .eq("company_id", company!.id)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const invoices = invoicesRes.data ?? [];
  const shipments = shipmentsRes.data ?? [];
  const carriers = carriersRes.data ?? [];
  const exceptions = exceptionsRes.data ?? [];

  const totalInvoiceSpend = invoices.reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status !== "paid" || invoice.approval_status !== "approved"
  ).length;
  const shipmentExceptionRate = shipments.length
    ? shipments.filter((shipment) => shipment.status === "exception").length / shipments.length
    : 0;
  const activeCarriers = carriers.filter((carrier) => carrier.status === "active").length;
  const openExceptions = exceptions.filter((exception) => exception.status !== "resolved").length;

  const codexPayload = {
    input: [
      {
        content: [
          {
            text:
              "You are Codex, a logistics optimization analyst. Return JSON only with keys: title, summary, recommendation_type, feasibility, estimated_savings, savings_percent.",
            type: "input_text",
          },
          {
            text: `User request: ${analysisPrompt}`,
            type: "input_text",
          },
          {
            text: `Company: ${company?.name ?? "Workspace"}
Metrics:
- total_invoice_spend_usd: ${totalInvoiceSpend.toFixed(2)}
- pending_invoice_count: ${pendingInvoices}
- shipment_exception_rate: ${shipmentExceptionRate.toFixed(4)}
- active_carrier_count: ${activeCarriers}
- open_exception_count: ${openExceptions}

Provide one high-impact recommendation with realistic numbers.`,
            type: "input_text",
          },
        ],
        role: "user",
      },
    ],
    model: process.env.OPENAI_CODEX_MODEL || "gpt-5-codex",
    reasoning: {
      effort: "medium",
    },
    text: {
      format: {
        name: "ai_recommendation",
        schema: {
          additionalProperties: false,
          properties: {
            estimated_savings: { type: "number" },
            feasibility: { enum: ["low", "medium", "high"], type: "string" },
            recommendation_type: { type: "string" },
            savings_percent: { type: "number" },
            summary: { type: "string" },
            title: { type: "string" },
          },
          required: [
            "title",
            "summary",
            "recommendation_type",
            "feasibility",
            "estimated_savings",
            "savings_percent",
          ],
          type: "object",
        },
        type: "json_schema",
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify(codexPayload),
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    redirectWithStatus("error", `Codex request failed: ${errorText.slice(0, 160)}`);
  }

  const codexResult = (await response.json()) as CodexResponse;
  const outputText = readCodexText(codexResult);

  if (!outputText) {
    redirectWithStatus("error", "Codex response was empty.");
  }

  let parsed: {
    estimated_savings: number;
    feasibility: "low" | "medium" | "high";
    recommendation_type: string;
    savings_percent: number;
    summary: string;
    title: string;
  };
  try {
    parsed = JSON.parse(outputText) as typeof parsed;
  } catch {
    redirectWithStatus("error", "Codex response was not valid JSON.");
  }

  const { data: recommendation, error } = await supabase
    .from("optimization_recommendations")
    .insert({
      company_id: company!.id,
      created_by: profile!.id,
      estimated_savings: Number(parsed.estimated_savings || 0),
      feasibility: parsed.feasibility || "medium",
      impact_score: clamp(Number(parsed.savings_percent || 0), 0, 99),
      recommendation_type: parsed.recommendation_type || "ai_copilot",
      savings_percent: Number(parsed.savings_percent || 0),
      summary: parsed.summary,
      supporting_data: {
        model: codexPayload.model,
        source: "codex_api",
        user_prompt: analysisPrompt,
      },
      title: parsed.title,
    })
    .select("id")
    .single();

  if (error || !recommendation) {
    redirectWithStatus("error", "AI recommendation generated, but failed to save.");
  }

  await logActivity(supabase, {
    action: "intelligence.codex.recommendation_generated",
    actorProfileId: profile!.id,
    companyId: company!.id,
    entityId: recommendation.id,
    entityType: "optimization_recommendation",
    metadata: {
      model: codexPayload.model,
      recommendation_type: parsed.recommendation_type,
    },
    summary: `Generated AI recommendation "${parsed.title}".`,
  });

  revalidatePath(INTELLIGENCE_PATH);
  redirectWithStatus("message", "AI recommendation generated.");
}
