"use client";

import { useEffect, useState } from "react";
import { 
  LineChart, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TrendChart from "@/components/charts/TrendChart";
import { fetchAPI, formatNumber, formatPercent } from "@/lib/utils";
import type { MetricsResponse, DailyMetric } from "@/types";

export default function MetricsPage() {
  const [metrics30, setMetrics30] = useState<MetricsResponse | null>(null);
  const [metrics90, setMetrics90] = useState<MetricsResponse | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 90>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [data30, data90] = await Promise.all([
          fetchAPI<MetricsResponse>("/api/metrics?days=30"),
          fetchAPI<MetricsResponse>("/api/metrics?days=90"),
        ]);
        
        setMetrics30(data30);
        setMetrics90(data90);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetrics();
  }, []);

  const currentMetrics = selectedPeriod === 30 ? metrics30 : metrics90;
  const aggregatedStats = calculateAggregatedStats(currentMetrics?.data || []);

  if (loading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Metrics
          </h1>
          <p className="text-slate-500 mt-1">
            Historical trends and performance analytics
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setSelectedPeriod(30)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPeriod === 30
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setSelectedPeriod(90)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPeriod === 90
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Scans"
          value={formatNumber(aggregatedStats.totalScans)}
          change={aggregatedStats.scansTrend}
          icon={<LineChart className="w-5 h-5" />}
        />
        <MetricCard
          title="Avg Pass Rate"
          value={formatPercent(aggregatedStats.avgPassRate)}
          change={aggregatedStats.passRateTrend}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Critical Issues"
          value={formatNumber(aggregatedStats.criticalIssues)}
          change={aggregatedStats.criticalTrend}
          icon={<TrendingDown className="w-5 h-5" />}
          invertTrend
        />
        <MetricCard
          title="Blocked PRs"
          value={formatNumber(aggregatedStats.blockedPRs)}
          change={aggregatedStats.blockedTrend}
          icon={<Calendar className="w-5 h-5" />}
          invertTrend
        />
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-green-500" />
            Scan Results Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <TrendChart data={currentMetrics?.data || []} showLegend />
          </div>
        </CardContent>
      </Card>

      {/* Issue Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SeverityBar
                label="Critical"
                value={aggregatedStats.criticalIssues}
                total={aggregatedStats.totalIssues}
                color="bg-red-500"
              />
              <SeverityBar
                label="High"
                value={aggregatedStats.highIssues}
                total={aggregatedStats.totalIssues}
                color="bg-orange-500"
              />
              <SeverityBar
                label="Medium"
                value={aggregatedStats.mediumIssues}
                total={aggregatedStats.totalIssues}
                color="bg-yellow-500"
              />
              <SeverityBar
                label="Low"
                value={aggregatedStats.lowIssues}
                total={aggregatedStats.totalIssues}
                color="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SeverityBar
                label="Passed"
                value={aggregatedStats.passedScans}
                total={aggregatedStats.totalScans}
                color="bg-green-500"
              />
              <SeverityBar
                label="Warned"
                value={aggregatedStats.warnedScans}
                total={aggregatedStats.totalScans}
                color="bg-yellow-500"
              />
              <SeverityBar
                label="Blocked"
                value={aggregatedStats.blockedPRs}
                total={aggregatedStats.totalScans}
                color="bg-red-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
  invertTrend = false,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  invertTrend?: boolean;
}) {
  const isPositive = invertTrend ? change < 0 : change > 0;
  const isNeutral = change === 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 text-sm">{title}</span>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{value}</span>
          <div className={`flex items-center gap-1 text-sm ${
            isNeutral ? 'text-slate-500' :
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isNeutral ? <Minus className="w-4 h-4" /> :
             isPositive ? <TrendingUp className="w-4 h-4" /> : 
             <TrendingDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium">{formatNumber(value)}</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function calculateAggregatedStats(data: DailyMetric[]) {
  if (data.length === 0) {
    return {
      totalScans: 0,
      passedScans: 0,
      warnedScans: 0,
      blockedPRs: 0,
      avgPassRate: 100,
      totalIssues: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      scansTrend: 0,
      passRateTrend: 0,
      criticalTrend: 0,
      blockedTrend: 0,
    };
  }

  const totals = data.reduce(
    (acc, day) => ({
      totalScans: acc.totalScans + day.total_scans,
      passed: acc.passed + day.passed,
      warned: acc.warned + day.warned,
      blocked: acc.blocked + day.blocked,
      critical: acc.critical + day.critical_issues,
      high: acc.high + day.high_issues,
      medium: acc.medium + day.medium_issues,
      low: acc.low + day.low_issues,
    }),
    { totalScans: 0, passed: 0, warned: 0, blocked: 0, critical: 0, high: 0, medium: 0, low: 0 }
  );

  // Calculate trends (compare first half to second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstHalfScans = firstHalf.reduce((sum, d) => sum + d.total_scans, 0);
  const secondHalfScans = secondHalf.reduce((sum, d) => sum + d.total_scans, 0);
  const scansTrend = firstHalfScans > 0 ? ((secondHalfScans - firstHalfScans) / firstHalfScans) * 100 : 0;

  const firstHalfPassRate = firstHalf.length > 0 
    ? firstHalf.reduce((sum, d) => sum + d.pass_rate, 0) / firstHalf.length : 100;
  const secondHalfPassRate = secondHalf.length > 0 
    ? secondHalf.reduce((sum, d) => sum + d.pass_rate, 0) / secondHalf.length : 100;
  const passRateTrend = secondHalfPassRate - firstHalfPassRate;

  const firstHalfCritical = firstHalf.reduce((sum, d) => sum + d.critical_issues, 0);
  const secondHalfCritical = secondHalf.reduce((sum, d) => sum + d.critical_issues, 0);
  const criticalTrend = firstHalfCritical > 0 
    ? ((secondHalfCritical - firstHalfCritical) / firstHalfCritical) * 100 : 0;

  const firstHalfBlocked = firstHalf.reduce((sum, d) => sum + d.blocked, 0);
  const secondHalfBlocked = secondHalf.reduce((sum, d) => sum + d.blocked, 0);
  const blockedTrend = firstHalfBlocked > 0 
    ? ((secondHalfBlocked - firstHalfBlocked) / firstHalfBlocked) * 100 : 0;

  return {
    totalScans: totals.totalScans,
    passedScans: totals.passed,
    warnedScans: totals.warned,
    blockedPRs: totals.blocked,
    avgPassRate: totals.totalScans > 0 ? (totals.passed / totals.totalScans) * 100 : 100,
    totalIssues: totals.critical + totals.high + totals.medium + totals.low,
    criticalIssues: totals.critical,
    highIssues: totals.high,
    mediumIssues: totals.medium,
    lowIssues: totals.low,
    scansTrend,
    passRateTrend,
    criticalTrend,
    blockedTrend,
  };
}

function MetricsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="h-4 w-64 skeleton rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-20 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-[400px] skeleton rounded" />
      </div>
    </div>
  );
}

