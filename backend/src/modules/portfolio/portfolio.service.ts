import { prisma } from "../../lib/prisma";

type PortfolioInput = {
  totalValue: number;
  monthlyContribution: number;
  riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
};

export const portfolioService = {
  async getByUserId(userId: string) {
    return prisma.portfolio.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });
  },

  async upsert(userId: string, input: PortfolioInput) {
    const existing = await prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!existing) {
      return prisma.portfolio.create({
        data: {
          userId,
          totalValue: input.totalValue,
          monthlyContribution: input.monthlyContribution,
          riskProfile: input.riskProfile,
        },
      });
    }

    return prisma.portfolio.update({
      where: { id: existing.id },
      data: {
        totalValue: input.totalValue,
        monthlyContribution: input.monthlyContribution,
        riskProfile: input.riskProfile,
      },
    });
  },

  async getAnalytics(portfolioId: string, userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        holdings: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!portfolio) {
      return null;
    }

    const netWorth = Number(portfolio.totalValue ?? 0);
    const monthlyContribution = Number(portfolio.monthlyContribution ?? 0);
    const score = Math.min(100, Math.round((monthlyContribution / Math.max(1, netWorth)) * 1000));

    const totalHoldingValue = portfolio.holdings.reduce((sum: number, holding: any) => {
      const price = Number(holding.currentPrice ?? holding.averageCost ?? 0);
      return sum + Number(holding.quantity ?? 0) * price;
    }, 0);

    const allocationMap = portfolio.holdings.reduce((map: Record<string, number>, holding: any) => {
      const assetType = holding.asset?.assetType ?? "OTHER";
      const price = Number(holding.currentPrice ?? holding.averageCost ?? 0);
      const value = Number(holding.quantity ?? 0) * price;
      map[assetType] = (map[assetType] ?? 0) + value;
      return map;
    }, {});

    const assetAllocation = (Object.entries(allocationMap) as Array<[string, number]>).map(([label, value]) => ({
      label,
      value: totalHoldingValue > 0 ? Math.round((value / totalHoldingValue) * 100) : 0,
    }));

    const liquidityCash = allocationMap.CASH ?? 0;
    const monthlyExpenses = Math.max(1, monthlyContribution * 0.8);
    const runwayMonths = Number((liquidityCash / monthlyExpenses).toFixed(1));

    const recommendations = await prisma.recommendation.findMany({
      where: { userId, OR: [{ portfolioId }, { portfolioId: null }] },
      orderBy: { priority: "asc" },
      take: 3,
      select: { title: true },
    });

    return {
      portfolioId: portfolio.id,
      netWorth,
      score,
      assetAllocation: assetAllocation.length > 0 ? assetAllocation : [{ label: "CASH", value: 100 }],
      liquidity: {
        cashOnHand: Math.round(liquidityCash),
        monthlyExpenses: Math.round(monthlyExpenses),
        runwayMonths,
      },
      recommendations: recommendations.map((item: { title: string }) => item.title),
    };
  },
};
