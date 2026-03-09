import { prisma } from "../../lib/prisma";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toPercent(value: number) {
  return Number((value * 100).toFixed(1));
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export const analyticsService = {
  async getSummary(userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        holdings: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!portfolio) {
      return {
        generatedAt: new Date().toISOString(),
        portfolio: null,
        summary: {
          netWorth: 0,
          monthlyContribution: 0,
          score: 0,
          baseCurrency: "USD",
        },
        assetAllocation: [],
        liquidity: {
          cashOnHand: 0,
          estimatedMonthlyExpenses: 0,
          runwayMonths: 0,
          score: 0,
        },
        risk: {
          topAssetConcentrationPct: 0,
          diversificationScore: 0,
          concentrationScore: 0,
          resilienceScore: 0,
        },
        recommendations: [],
        trend: [],
        scoreReasons: [
          "No portfolio found yet. Add holdings to unlock wellness analytics.",
        ],
      };
    }

    const netWorth = toNumber(portfolio.totalValue);
    const monthlyContribution = toNumber(portfolio.monthlyContribution);

    const holdingsWithValue = portfolio.holdings.map((holding: any) => {
      const quantity = toNumber(holding.quantity);
      const price = toNumber(holding.currentPrice ?? holding.averageCost);
      const marketValue = quantity * price;

      return {
        id: holding.id,
        symbol: holding.asset.symbol,
        assetType: holding.asset.assetType,
        marketValue,
      };
    });

    const totalHoldingValue = holdingsWithValue.reduce(
      (sum: number, holding: any) => sum + holding.marketValue,
      0,
    );

    const allocationMap = holdingsWithValue.reduce(
      (acc: Record<string, number>, holding: any) => {
        const key = holding.assetType;
        acc[key] = (acc[key] ?? 0) + holding.marketValue;
        return acc;
      },
      {},
    );

    const assetAllocation = Object.entries(allocationMap)
      .map(([label, value]) => ({
        label,
        value: roundMoney(value),
        percent:
          totalHoldingValue > 0
            ? toPercent(value / totalHoldingValue)
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const symbolConcentration = holdingsWithValue
      .map((holding: any) =>
        totalHoldingValue > 0 ? holding.marketValue / totalHoldingValue : 0,
      )
      .sort((a: number, b: number) => b - a);

    const topAssetConcentration = symbolConcentration[0] ?? 0;
    const hhi = symbolConcentration.reduce(
      (sum: number, share: number) => sum + share * share,
      0,
    );

    const diversificationScore = Math.max(
      0,
      Math.min(100, Math.round((1 - hhi) * 100)),
    );
    const concentrationScore = Math.max(
      0,
      Math.min(100, Math.round((1 - topAssetConcentration) * 100)),
    );

    const cashOnHand = assetAllocation
      .filter((item) => item.label === "CASH")
      .reduce((sum, item) => sum + item.value, 0);

    const estimatedMonthlyExpenses = Math.max(1, monthlyContribution * 0.8);
    const runwayMonths = cashOnHand / estimatedMonthlyExpenses;
    const liquidityScore = Math.max(
      0,
      Math.min(100, Math.round((Math.min(runwayMonths, 6) / 6) * 100)),
    );

    const resilienceScore = Math.round(
      liquidityScore * 0.45 + diversificationScore * 0.55,
    );

    const score = Math.min(
      100,
      Math.round(
        monthlyContribution / Math.max(1, netWorth) * 300 +
          diversificationScore * 0.25 +
          concentrationScore * 0.25 +
          liquidityScore * 0.5,
      ),
    );

    const recommendations = await prisma.recommendation.findMany({
      where: {
        userId,
        OR: [{ portfolioId: portfolio.id }, { portfolioId: null }],
      },
      orderBy: { priority: "asc" },
      take: 3,
      select: {
        id: true,
        title: true,
        detail: true,
        priority: true,
      },
    });

    const existingTodaySnapshot = await prisma.analyticsSnapshot.findFirst({
      where: {
        userId,
        portfolioId: portfolio.id,
        generatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      orderBy: { generatedAt: "desc" },
      select: { id: true },
    });

    const snapshot = existingTodaySnapshot
      ? await prisma.analyticsSnapshot.update({
          where: { id: existingTodaySnapshot.id },
          data: {
            netWorth,
            monthlySavings: monthlyContribution,
            score,
          },
        })
      : await prisma.analyticsSnapshot.create({
          data: {
            userId,
            portfolioId: portfolio.id,
            netWorth,
            monthlySavings: monthlyContribution,
            score,
          },
        });

    const trendSnapshots = await prisma.analyticsSnapshot.findMany({
      where: { userId, portfolioId: portfolio.id },
      orderBy: { generatedAt: "desc" },
      take: 8,
      select: {
        generatedAt: true,
        netWorth: true,
        score: true,
      },
    });

    const scoreReasons = [
      `${Math.round(topAssetConcentration * 100)}% concentration in your largest position affects concentration score.`,
      `${Math.round(runwayMonths * 10) / 10} months of cash runway drives liquidity score.`,
      `${assetAllocation.length} asset classes detected across current holdings.`,
    ];

    return {
      generatedAt: snapshot.generatedAt.toISOString(),
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        riskProfile: portfolio.riskProfile,
        holdingsCount: portfolio.holdings.length,
      },
      summary: {
        netWorth: roundMoney(netWorth),
        monthlyContribution: roundMoney(monthlyContribution),
        score,
        baseCurrency: portfolio.baseCurrency,
      },
      assetAllocation,
      liquidity: {
        cashOnHand: roundMoney(cashOnHand),
        estimatedMonthlyExpenses: roundMoney(estimatedMonthlyExpenses),
        runwayMonths: Number(runwayMonths.toFixed(1)),
        score: liquidityScore,
      },
      risk: {
        topAssetConcentrationPct: Math.round(topAssetConcentration * 100),
        diversificationScore,
        concentrationScore,
        resilienceScore,
      },
      recommendations,
      trend: trendSnapshots.reverse().map((item) => ({
        generatedAt: item.generatedAt.toISOString(),
        netWorth: roundMoney(toNumber(item.netWorth)),
        score: item.score,
      })),
      scoreReasons,
    };
  },
};
