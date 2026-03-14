"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

export type CarrierSparklineDataPoint = {
  period: string;
  onTimeRate: number;
};

type CarrierSparklineProps = {
  data: CarrierSparklineDataPoint[];
  color?: string;
};

export function CarrierSparkline({
  data,
  color = "#10b981",
}: CarrierSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-12 w-full bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
        No data
      </div>
    );
  }

  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="onTimeRate"
            stroke={color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
