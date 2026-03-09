"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";

type DashboardAnalytics = {
  generatedAt: string;
  portfolio: {
    id: string;
    name: string;
    riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
    holdingsCount: number;
  } | null;
  summary: {
    netWorth: number;
    monthlyContribution: number;
    score: number;
    baseCurrency: string;
  };
  assetAllocation: Array<{ label: string; value: number; percent: number }>;
  liquidity: {
    cashOnHand: number;
    estimatedMonthlyExpenses: number;
    runwayMonths: number;
    score: number;
  };
  risk: {
    topAssetConcentrationPct: number;
    diversificationScore: number;
    concentrationScore: number;
    resilienceScore: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    detail: string;
    priority: number;
  }>;
  trend: Array<{
    generatedAt: string;
    netWorth: number;
    score: number;
  }>;
  scoreReasons: string[];
};

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "";

  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary", userId],
    queryFn: () =>
      apiFetch<DashboardAnalytics>("/analytics/summary", {
        headers: {
          "x-user-id": userId,
        },
      }),
    enabled: Boolean(userId),
    retry: 1,
  });

  const analytics = analyticsQuery.data;
  const maxTrendValue = Math.max(...(analytics?.trend.map((item) => item.netWorth) ?? [1]));

  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-sm text-amber-800">
            Missing user id. Open this page with <code>?userId=&lt;id&gt;</code> or set
            <code> NEXT_PUBLIC_DEMO_USER_ID</code>.
          </p>
        </div>
      </main>
    );
  }

  if (analyticsQuery.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600">Loading analytics summary...</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (analyticsQuery.isError || !analytics) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-sm text-rose-800">Failed to load `/api/analytics/summary`.</p>
          <p className="mt-2 text-xs text-rose-700">Check backend status and confirm `x-user-id` is valid.</p>
        </div>
      </main>
    );
  }

  if (!analytics.portfolio) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-sm text-slate-600">
            No portfolio found yet. Add holdings first to unlock allocation, score, and recommendations.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            {analytics.portfolio.name} - {analytics.portfolio.riskProfile} - Updated {formatDate(analytics.generatedAt)}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <p className="text-sm font-medium text-slate-500">Net Worth</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">
              {formatCurrency(analytics.summary.netWorth, analytics.summary.baseCurrency)}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Monthly contribution: {formatCurrency(analytics.summary.monthlyContribution, analytics.summary.baseCurrency)}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Wellness Score</p>
            <p className="mt-3 text-4xl font-bold text-emerald-700">{analytics.summary.score}/100</p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${analytics.summary.score}%` }} />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Liquidity Runway</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{analytics.liquidity.runwayMonths} months</p>
            <p className="mt-2 text-xs text-slate-600">
              Cash: {formatCurrency(analytics.liquidity.cashOnHand, analytics.summary.baseCurrency)}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Asset Allocation</h2>
            <div className="mt-4 space-y-3">
              {analytics.assetAllocation.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Top Recommendations</h2>
            <ul className="mt-4 space-y-3">
              {analytics.recommendations.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    P{item.priority}. {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Risk Breakdown</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-slate-500">Top Concentration</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{analytics.risk.topAssetConcentrationPct}%</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-slate-500">Diversification</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{analytics.risk.diversificationScore}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-slate-500">Concentration Score</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{analytics.risk.concentrationScore}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <p className="text-slate-500">Resilience Score</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{analytics.risk.resilienceScore}</p>
              </div>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {analytics.scoreReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Trend (Latest Snapshots)</h2>
            <div className="mt-4 flex h-40 items-end gap-2">
              {analytics.trend.map((point) => (
                <div key={point.generatedAt} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-blue-600"
                    style={{
                      height: `${Math.max(8, (point.netWorth / maxTrendValue) * 100)}%`,
                    }}
                  />
                  <p className="text-[10px] text-slate-600">{formatDate(point.generatedAt)}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
