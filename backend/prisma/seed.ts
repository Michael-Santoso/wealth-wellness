import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AssetType,
  PrismaClient,
  ProjectionCase,
  RiskProfile,
  UploadSource,
  UploadStatus,
} from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL. Set backend/.env before seeding.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const demoUser = {
  email: "demo.user@wealthwellnesshub.local",
  fullName: "Alex Tan",
};

const demoPortfolio = {
  name: "Primary Portfolio",
  baseCurrency: "USD",
  monthlyContribution: 1800,
  riskProfile: RiskProfile.BALANCED,
};

const demoHoldings = [
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    assetType: AssetType.ETF,
    quantity: 120,
    averageCost: 210,
    currentPrice: 245,
  },
  {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    assetType: AssetType.ETF,
    quantity: 80,
    averageCost: 55,
    currentPrice: 63,
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    assetType: AssetType.BOND,
    quantity: 70,
    averageCost: 71,
    currentPrice: 73,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    assetType: AssetType.CRYPTO,
    quantity: 0.42,
    averageCost: 56000,
    currentPrice: 64000,
  },
  {
    symbol: "USD-CASH",
    name: "High Yield Savings",
    assetType: AssetType.CASH,
    quantity: 1,
    averageCost: 18000,
    currentPrice: 18000,
  },
];

const demoRecommendations = [
  {
    title: "Increase liquidity buffer",
    detail: "Raise cash reserves from 2.8 to 4 months of expenses for better resilience.",
    priority: 1,
  },
  {
    title: "Trim crypto concentration",
    detail: "Cap crypto at 10-12% of portfolio value and rebalance quarterly.",
    priority: 2,
  },
  {
    title: "Automate monthly ETF contributions",
    detail: "Split new contributions 70/20/10 across VTI/VXUS/BND to improve consistency.",
    priority: 3,
  },
];

const projectionScenarios = [
  {
    scenario: ProjectionCase.BASE,
    years: 5,
    expectedAnnualReturn: 7.5,
    expectedAnnualVol: 14.0,
    growthMultiplier: 1.53,
  },
  {
    scenario: ProjectionCase.OPTIMISTIC,
    years: 5,
    expectedAnnualReturn: 10.2,
    expectedAnnualVol: 18.5,
    growthMultiplier: 1.75,
  },
  {
    scenario: ProjectionCase.CONSERVATIVE,
    years: 5,
    expectedAnnualReturn: 4.2,
    expectedAnnualVol: 9.5,
    growthMultiplier: 1.35,
  },
];

function calculatePortfolioValue() {
  return Number(
    demoHoldings
      .reduce((sum, item) => sum + item.quantity * item.currentPrice, 0)
      .toFixed(2),
  );
}

async function seed() {
  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    create: demoUser,
    update: { fullName: demoUser.fullName },
  });

  const existingPortfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id, name: demoPortfolio.name },
    select: { id: true },
  });

  const totalValue = calculatePortfolioValue();

  const portfolio = existingPortfolio
    ? await prisma.portfolio.update({
        where: { id: existingPortfolio.id },
        data: {
          baseCurrency: demoPortfolio.baseCurrency,
          monthlyContribution: demoPortfolio.monthlyContribution,
          riskProfile: demoPortfolio.riskProfile,
          totalValue,
        },
      })
    : await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: demoPortfolio.name,
          baseCurrency: demoPortfolio.baseCurrency,
          monthlyContribution: demoPortfolio.monthlyContribution,
          riskProfile: demoPortfolio.riskProfile,
          totalValue,
        },
      });

  for (const item of demoHoldings) {
    const asset = await prisma.asset.upsert({
      where: { symbol: item.symbol },
      create: {
        symbol: item.symbol,
        name: item.name,
        assetType: item.assetType,
        currency: "USD",
      },
      update: {
        name: item.name,
        assetType: item.assetType,
        currency: "USD",
      },
    });

    await prisma.holding.upsert({
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
    });

    const snapshotAsOf = new Date("2026-03-09T00:00:00.000Z");
    await prisma.assetSnapshot.upsert({
      where: {
        assetId_asOf: {
          assetId: asset.id,
          asOf: snapshotAsOf,
        },
      },
      create: {
        assetId: asset.id,
        price: item.currentPrice,
        asOf: snapshotAsOf,
        source: "DEMO",
      },
      update: {
        price: item.currentPrice,
        source: "DEMO",
      },
    });
  }

  const existingAnalytics = await prisma.analyticsSnapshot.findFirst({
    where: { userId: user.id, portfolioId: portfolio.id },
    orderBy: { generatedAt: "desc" },
    select: { id: true },
  });

  const score = Math.min(
    100,
    Math.round((demoPortfolio.monthlyContribution / Math.max(1, totalValue)) * 1000),
  );

  if (existingAnalytics) {
    await prisma.analyticsSnapshot.update({
      where: { id: existingAnalytics.id },
      data: {
        netWorth: totalValue,
        monthlySavings: demoPortfolio.monthlyContribution,
        score,
      },
    });
  } else {
    await prisma.analyticsSnapshot.create({
      data: {
        userId: user.id,
        portfolioId: portfolio.id,
        netWorth: totalValue,
        monthlySavings: demoPortfolio.monthlyContribution,
        score,
      },
    });
  }

  for (const rec of demoRecommendations) {
    const existing = await prisma.recommendation.findFirst({
      where: {
        userId: user.id,
        portfolioId: portfolio.id,
        title: rec.title,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.recommendation.update({
        where: { id: existing.id },
        data: rec,
      });
    } else {
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          portfolioId: portfolio.id,
          ...rec,
        },
      });
    }
  }

  for (const scenario of projectionScenarios) {
    const projectedEndingValue = Number(
      (totalValue * scenario.growthMultiplier + demoPortfolio.monthlyContribution * 12 * scenario.years)
        .toFixed(2),
    );

    const existing = await prisma.projectionScenario.findFirst({
      where: {
        userId: user.id,
        portfolioId: portfolio.id,
        scenario: scenario.scenario,
      },
      select: { id: true },
    });

    const projectionData = {
      scenario: scenario.scenario,
      years: scenario.years,
      expectedAnnualReturn: scenario.expectedAnnualReturn,
      expectedAnnualVol: scenario.expectedAnnualVol,
      monthlyContribution: demoPortfolio.monthlyContribution,
      projectedEndingValue,
      assumptions: {
        seedType: "demo",
        notes: "Deterministic hackathon projection assumptions",
      },
    };

    if (existing) {
      await prisma.projectionScenario.update({
        where: { id: existing.id },
        data: projectionData,
      });
    } else {
      await prisma.projectionScenario.create({
        data: {
          userId: user.id,
          portfolioId: portfolio.id,
          ...projectionData,
        },
      });
    }
  }

  const existingUploadJob = await prisma.uploadJob.findFirst({
    where: {
      userId: user.id,
      portfolioId: portfolio.id,
      fileName: "demo_portfolio_seed.csv",
    },
    select: { id: true },
  });

  const uploadPayload = {
    source: UploadSource.CSV,
    status: UploadStatus.PROCESSED,
    fileName: "demo_portfolio_seed.csv",
    rawInput: "seeded-demo-data",
    parsedHoldings: demoHoldings,
  };

  if (existingUploadJob) {
    await prisma.uploadJob.update({
      where: { id: existingUploadJob.id },
      data: uploadPayload,
    });
  } else {
    await prisma.uploadJob.create({
      data: {
        userId: user.id,
        portfolioId: portfolio.id,
        ...uploadPayload,
      },
    });
  }

  console.log(
    `Seed complete for ${demoUser.email}. x-user-id=${user.id}, portfolioId=${portfolio.id}`,
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
