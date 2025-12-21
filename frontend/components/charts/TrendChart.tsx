"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { DailyMetric } from "@/types";

interface TrendChartProps {
  data: DailyMetric[];
  showLegend?: boolean;
}

export default function TrendChart({ data, showLegend = false }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    passed: item.passed,
    warned: item.warned,
    blocked: item.blocked,
    total: item.total_scans,
    passRate: item.pass_rate,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorWarned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
            color: "#f8fafc",
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
          />
        )}
        <Area
          type="monotone"
          dataKey="passed"
          name="Passed"
          stroke="#22c55e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPassed)"
        />
        <Area
          type="monotone"
          dataKey="warned"
          name="Warned"
          stroke="#f59e0b"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorWarned)"
        />
        <Area
          type="monotone"
          dataKey="blocked"
          name="Blocked"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorBlocked)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

