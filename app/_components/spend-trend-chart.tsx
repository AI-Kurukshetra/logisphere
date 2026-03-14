"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SpendTrendDataPoint = {
  period: string;
  amount: number;
  forecast?: number;
  confidence_80?: number;
  confidence_95?: number;
};

type SpendTrendChartProps = {
  data: SpendTrendDataPoint[];
  forecast?: SpendTrendDataPoint[];
  source?: "codex_api" | "linear_regression";
};

export function SpendTrendChart({ data, forecast, source }: SpendTrendChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Merge history and forecast
  const combined = [
    ...data.map((d) => ({
      ...d,
      type: "history" as const,
    })),
    ...(forecast ?? []).map((f) => ({
      ...f,
      type: "forecast" as const,
    })),
  ];

  const hasConfidenceBands = forecast && forecast.some((f) => f.confidence_80);

  const sourceLabel = source === "codex_api" ? "Codex AI" : "Linear Regression";

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Spend Trend & Forecast</h3>
        {source && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {sourceLabel}
          </span>
        )}
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combined} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#666" }}
              axisLine={{ stroke: "#e0e0e0" }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: "#666" }}
              axisLine={{ stroke: "#e0e0e0" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              formatter={(value: any) => {
                if (typeof value === "number") return formatCurrency(value);
                return value;
              }}
              labelStyle={{ color: "#333" }}
            />
            {/* Confidence band (80%) */}
            {hasConfidenceBands && (
              <Area
                dataKey="confidence_80"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                isAnimationActive={false}
              />
            )}
            {/* History line */}
            <Line
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              connectNulls={true}
              isAnimationActive={true}
              name="Actual Spend"
            />
            {/* Forecast line (dashed) */}
            {forecast && forecast.length > 0 && (
              <Line
                dataKey="forecast"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#ef4444", r: 4 }}
                connectNulls={true}
                isAnimationActive={true}
                name="Forecast"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
