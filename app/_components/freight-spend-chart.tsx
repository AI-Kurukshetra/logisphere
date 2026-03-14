"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FreightSpendChartDataPoint = {
  label: string;
  amount: number;
};

type FreightSpendChartProps = {
  data: FreightSpendChartDataPoint[];
  maxAmount: number;
};

export function FreightSpendChart({ data, maxAmount }: FreightSpendChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="w-full h-64 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
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
          <Bar
            dataKey="amount"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
