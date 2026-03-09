"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";

type IngestResponse = {
  portfolio: {
    id: string;
    name: string;
    baseCurrency: string;
    totalValue: number;
    monthlyContribution: number;
    riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
  };
  holdings: Array<{
    holdingId: string;
    symbol: string;
    name: string;
    assetType: string;
    currency: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    marketValue: number;
  }>;
  summary: {
    holdingsCount: number;
    totalHoldingsValue: number;
    uploadedAt: string;
    normalizedInputCount?: number;
  };
};

const demoHoldingsInput = JSON.stringify(
  [
    {
      symbol: "vti",
      name: "Vanguard Total Stock Market ETF",
      assetType: "etf",
      currency: "usd",
      quantity: 120,
      averageCost: 210.155,
      currentPrice: 245.499,
    },
    {
      symbol: "btc",
      name: "Bitcoin",
      assetType: "crypto",
      quantity: 0.42,
      averageCost: 56000,
      currentPrice: 64000,
    },
    {
      symbol: "",
      name: "Invalid row removed",
      assetType: "cash",
      quantity: 10,
      averageCost: 1,
      currentPrice: 1,
    },
  ],
  null,
  2,
);

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PortfolioPage() {
  const [userId, setUserId] = useState(process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "");
  const [portfolioName, setPortfolioName] = useState("Primary Portfolio");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [totalValue, setTotalValue] = useState("80000");
  const [monthlyContribution, setMonthlyContribution] = useState("1800");
  const [riskProfile, setRiskProfile] = useState<"CONSERVATIVE" | "BALANCED" | "AGGRESSIVE">("BALANCED");
  const [holdingsJson, setHoldingsJson] = useState(demoHoldingsInput);
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedHoldingsPreviewCount = useMemo(() => {
    try {
      const parsed = JSON.parse(holdingsJson);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [holdingsJson]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!userId.trim()) {
      setError("User id is required.");
      return;
    }

    let parsedHoldings: unknown;
    try {
      parsedHoldings = JSON.parse(holdingsJson);
    } catch {
      setError("Holdings JSON is invalid.");
      return;
    }

    if (!Array.isArray(parsedHoldings)) {
      setError("Holdings must be a JSON array.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch<IngestResponse>("/portfolio/ingest/manual", {
        method: "POST",
        headers: {
          "x-user-id": userId.trim(),
        },
        body: JSON.stringify({
          portfolio: {
            name: portfolioName,
            baseCurrency,
            totalValue: Number(totalValue),
            monthlyContribution: Number(monthlyContribution),
            riskProfile,
          },
          holdings: parsedHoldings,
        }),
      });

      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to ingest holdings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-3xl font-semibold">Portfolio Ingestion</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manual ingest flow wired to <code>POST /api/portfolio/ingest/manual</code>. This path exercises backend holdings normalization.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">User ID</span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="x-user-id"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Portfolio Name</span>
              <input
                value={portfolioName}
                onChange={(event) => setPortfolioName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Base Currency</span>
              <input
                value={baseCurrency}
                onChange={(event) => setBaseCurrency(event.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Risk Profile</span>
              <select
                value={riskProfile}
                onChange={(event) => setRiskProfile(event.target.value as "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="CONSERVATIVE">CONSERVATIVE</option>
                <option value="BALANCED">BALANCED</option>
                <option value="AGGRESSIVE">AGGRESSIVE</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Total Value</span>
              <input
                type="number"
                min="0"
                value={totalValue}
                onChange={(event) => setTotalValue(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Monthly Contribution</span>
              <input
                type="number"
                min="0"
                value={monthlyContribution}
                onChange={(event) => setMonthlyContribution(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Holdings JSON ({parsedHoldingsPreviewCount} rows parsed)</span>
            <textarea
              value={holdingsJson}
              onChange={(event) => setHoldingsJson(event.target.value)}
              rows={14}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Ingest Holdings"}
            </button>
            <Link href="/" className="text-sm font-medium text-blue-600">
              Back to hub
            </Link>
          </div>

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </form>

        {result ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Ingest Result</h2>
            <p className="mt-2 text-sm text-slate-600">
              Portfolio: {result.portfolio.name} ({result.portfolio.riskProfile})
            </p>
            <p className="text-sm text-slate-600">
              Holdings kept: {result.summary.holdingsCount}
              {typeof result.summary.normalizedInputCount === "number"
                ? ` / normalized input: ${result.summary.normalizedInputCount}`
                : ""}
            </p>
            <p className="text-sm text-slate-600">
              Total holdings value: {formatCurrency(result.summary.totalHoldingsValue, result.portfolio.baseCurrency)}
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Market Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.holdings.map((holding) => (
                    <tr key={holding.holdingId} className="border-b border-slate-100">
                      <td className="py-2 font-medium">{holding.symbol}</td>
                      <td className="py-2">{holding.assetType}</td>
                      <td className="py-2">{holding.quantity}</td>
                      <td className="py-2">{formatCurrency(holding.currentPrice, holding.currency)}</td>
                      <td className="py-2">{formatCurrency(holding.marketValue, holding.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
