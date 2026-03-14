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

export type CarrierSpendDataPoint = {
  carrier_id: string;
  carrier_name: string;
  amount: number;
};

type CarrierSpendChartProps = {
  data: CarrierSpendDataPoint[];
};

export function CarrierSpendChart({ data }: CarrierSpendChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Take top 8 carriers
  const topCarriers = data.slice(0, 8);
  const maxAmount = Math.max(...topCarriers.map((c) => c.amount), 1);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <h3 className="font-semibold text-slate-900 mb-4">Top Carriers by Spend</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topCarriers}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: "#666" }} />
            <YAxis
              dataKey="carrier_name"
              type="category"
              tick={{ fontSize: 12, fill: "#666" }}
              width={110}
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
              fill="#8b5cf6"
              radius={[0, 8, 8, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.length > 8 && (
        <p className="text-xs text-slate-500 mt-2">
          Showing top 8 of {data.length} carriers
        </p>
      )}
    </div>
  );
}
