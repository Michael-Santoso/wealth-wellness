"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";

type DashboardAnalytics = {
  portfolioId: string;
  netWorth: number;
  score: number;
  assetAllocation: Array<{ label: string; value: number }>;
  liquidity: {
    cashOnHand: number;
    monthlyExpenses: number;
    runwayMonths: number;
  };
  recommendations: string[];
};

const mockDashboard: DashboardAnalytics = {
  portfolioId: "mock-portfolio",
  netWorth: 128450,
  score: 78,
  assetAllocation: [
    { label: "EQUITIES", value: 52 },
    { label: "BONDS", value: 23 },
    { label: "CASH", value: 15 },
    { label: "ALTERNATIVES", value: 10 },
  ],
  liquidity: {
    cashOnHand: 18750,
    monthlyExpenses: 4200,
    runwayMonths: 4.5,
  },
  recommendations: [
    "Increase emergency fund to 6 months of expenses.",
    "Set up an automatic monthly ETF contribution.",
    "Reduce concentration in a single sector by 8-10%.",
  ],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolioId") ?? process.env.NEXT_PUBLIC_DEMO_PORTFOLIO_ID ?? "";
  const userId = searchParams.get("userId") ?? process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "";

  const analyticsQuery = useQuery({
    queryKey: ["portfolio-analytics", portfolioId, userId],
    queryFn: () =>
      apiFetch<DashboardAnalytics>(`/portfolio/${portfolioId}/analytics`, {
        headers: {
          "x-user-id": userId,
        },
      }),
    enabled: Boolean(portfolioId && userId),
    retry: 1,
  });

  const dashboard = analyticsQuery.data ?? mockDashboard;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Live data from `GET /api/portfolio/:id/analytics` with mock fallback.</p>
          {!portfolioId || !userId ? (
            <p className="mt-2 text-xs text-amber-700">Pass `portfolioId` and `userId` in the URL query to fetch backend analytics.</p>
          ) : null}
          {analyticsQuery.isError ? (
            <p className="mt-2 text-xs text-amber-700">Backend request failed. Showing mock data.</p>
          ) : null}
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <p className="text-sm font-medium text-slate-500">Net Worth</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{formatCurrency(dashboard.netWorth)}</p>
            <p className="mt-2 text-xs text-emerald-600">{analyticsQuery.isFetching ? "Refreshing..." : "Current snapshot"}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Wellness Score</p>
            <p className="mt-3 text-4xl font-bold text-blue-700">{dashboard.score}/100</p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${dashboard.score}%` }} />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Liquidity</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{dashboard.liquidity.runwayMonths} months</p>
            <p className="mt-2 text-xs text-slate-600">
              {formatCurrency(dashboard.liquidity.cashOnHand)} cash, {formatCurrency(dashboard.liquidity.monthlyExpenses)} monthly burn
            </p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Asset Allocation</h2>
            <div className="mt-4 space-y-3">
              {dashboard.assetAllocation.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Recommendations</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {dashboard.recommendations.map((tip) => (
                <li key={tip} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {tip}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}