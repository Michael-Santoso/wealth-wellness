import { prisma } from "../../lib/prisma";

type PortfolioInput = {
  name?: string;
  baseCurrency?: string;
  totalValue: number;
  monthlyContribution: number;
  riskProfile: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
};

type HoldingInput = {
  symbol: string;
  name: string;
  assetType: "STOCK" | "ETF" | "BOND" | "CASH" | "CRYPTO" | "OTHER";
  currency?: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
};

type IngestHoldingsInput = {
  portfolio: PortfolioInput;
  holdings: HoldingInput[];
};

type CreateUploadJobInput = {
  portfolioId?: string;
  source: "MANUAL" | "CSV" | "AI_EXTRACT" | "WALLET";
  fileName?: string;
  rawInput?: string;
  parsedHoldings?: HoldingInput[];
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toHoldingDto(holding: any) {
  const quantity = toNumber(holding.quantity);
  const averageCost = toNumber(holding.averageCost);
  const currentPrice = toNumber(holding.currentPrice ?? holding.averageCost);

  return {
    holdingId: holding.id,
    assetId: holding.assetId,
    symbol: holding.asset.symbol,
    name: holding.asset.name,
    assetType: holding.asset.assetType,
    currency: holding.asset.currency,
    quantity,
    averageCost,
    currentPrice,
    marketValue: Number((quantity * currentPrice).toFixed(2)),
  };
}

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
          name: input.name ?? "Primary Portfolio",
          baseCurrency: input.baseCurrency ?? "USD",
          totalValue: input.totalValue,
          monthlyContribution: input.monthlyContribution,
          riskProfile: input.riskProfile,
        },
      });
    }

    return prisma.portfolio.update({
      where: { id: existing.id },
      data: {
        name: input.name ?? existing.name,
        baseCurrency: input.baseCurrency ?? existing.baseCurrency,
        totalValue: input.totalValue,
        monthlyContribution: input.monthlyContribution,
        riskProfile: input.riskProfile,
      },
    });
  },

  async ingestHoldings(userId: string, input: IngestHoldingsInput) {
    const portfolio = await portfolioService.upsert(userId, input.portfolio);

    const holdings = await prisma.$transaction(async (tx: any) => {
      const persisted = [];

      for (const item of input.holdings) {
        const asset = await tx.asset.upsert({
          where: { symbol: item.symbol.toUpperCase() },
          create: {
            symbol: item.symbol.toUpperCase(),
            name: item.name,
            assetType: item.assetType,
            currency: item.currency ?? input.portfolio.baseCurrency ?? "USD",
          },
          update: {
            name: item.name,
            assetType: item.assetType,
            currency: item.currency ?? input.portfolio.baseCurrency ?? "USD",
          },
        });

        const holding = await tx.holding.upsert({
          where: {
            portfolioId_assetId: {
              portfolioId: portfolio.id,
              assetId: asset.id,
            },
          },
          create: {
            portfolioId: portfolio.id,
            assetId: asset.id,
            quantity: item.quantity,
            averageCost: item.averageCost,
            currentPrice: item.currentPrice,
          },
          update: {
            quantity: item.quantity,
            averageCost: item.averageCost,
            currentPrice: item.currentPrice,
          },
          include: { asset: true },
        });

        persisted.push(holding);
      }

      return persisted;
    });

    const normalizedHoldings = holdings.map(toHoldingDto);
    const totalHoldingsValue = normalizedHoldings.reduce((sum: number, item: any) => sum + item.marketValue, 0);

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        baseCurrency: portfolio.baseCurrency,
        totalValue: toNumber(portfolio.totalValue),
        monthlyContribution: toNumber(portfolio.monthlyContribution),
        riskProfile: portfolio.riskProfile,
      },
      holdings: normalizedHoldings,
      summary: {
        holdingsCount: normalizedHoldings.length,
        totalHoldingsValue: Number(totalHoldingsValue.toFixed(2)),
        uploadedAt: new Date().toISOString(),
      },
    };
  },

  async getHoldings(portfolioId: string, userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        holdings: {
          include: { asset: true },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!portfolio) {
      return null;
    }

    const holdings = portfolio.holdings.map(toHoldingDto);
    const totalHoldingsValue = holdings.reduce((sum: number, item: any) => sum + item.marketValue, 0);

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        baseCurrency: portfolio.baseCurrency,
      },
      holdings,
      summary: {
        holdingsCount: holdings.length,
        totalHoldingsValue: Number(totalHoldingsValue.toFixed(2)),
      },
    };
  },

  async createUploadJob(userId: string, input: CreateUploadJobInput) {
    if (input.portfolioId) {
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: input.portfolioId, userId },
        select: { id: true },
      });

      if (!portfolio) {
        return null;
      }
    }

    const status = input.parsedHoldings && input.parsedHoldings.length > 0 ? "PROCESSED" : "PENDING";

    return prisma.uploadJob.create({
      data: {
        userId,
        portfolioId: input.portfolioId,
        source: input.source,
        status,
        fileName: input.fileName,
        rawInput: input.rawInput,
        parsedHoldings: input.parsedHoldings ?? undefined,
      },
    });
  },

  async getUploadJobs(userId: string) {
    return prisma.uploadJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
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

    const netWorth = toNumber(portfolio.totalValue);
    const monthlyContribution = toNumber(portfolio.monthlyContribution);
    const score = Math.min(100, Math.round((monthlyContribution / Math.max(1, netWorth)) * 1000));

    const totalHoldingValue = portfolio.holdings.reduce((sum: number, holding: any) => {
      const price = toNumber(holding.currentPrice ?? holding.averageCost);
      return sum + toNumber(holding.quantity) * price;
    }, 0);

    const allocationMap = portfolio.holdings.reduce((map: Record<string, number>, holding: any) => {
      const assetType = holding.asset?.assetType ?? "OTHER";
      const price = toNumber(holding.currentPrice ?? holding.averageCost);
      const value = toNumber(holding.quantity) * price;
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
