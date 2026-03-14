"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BudgetVsActualDataPoint = {
  fiscal_month: number;
  budget_amount: number;
  actual_amount: number;
  variance?: number;
  variance_percent?: number;
};

type BudgetVsActualChartProps = {
  data: BudgetVsActualDataPoint[];
  fiscalYear?: number;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function BudgetVsActualChart({ data, fiscalYear }: BudgetVsActualChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const chartData = data.map((d) => ({
    ...d,
    month: MONTH_NAMES[d.fiscal_month - 1] || `M${d.fiscal_month}`,
  }));

  const maxAmount = Math.max(
    ...chartData.map((d) => Math.max(d.budget_amount, d.actual_amount)),
    1
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Budget vs Actual</h3>
        {fiscalYear && <span className="text-xs text-slate-600">FY{fiscalYear}</span>}
      </div>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          <p>No budget vs actual data available yet</p>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#666" }}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: "#666" }}
                axisLine={{ stroke: "#e0e0e0" }}
                domain={[0, maxAmount]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: "#333" }}
              />
              <Legend />
              <Bar
                dataKey="budget_amount"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name="Budget"
                isAnimationActive={true}
              />
              <Bar
                dataKey="actual_amount"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                name="Actual"
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
