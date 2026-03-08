import { prisma } from "../../lib/prisma";

export const analyticsService = {
  async getSummary(userId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!portfolio) {
      return {
        message: "No portfolio found yet",
        score: 0,
      };
    }

    const score = Math.min(
      100,
      Math.round((Number(portfolio.monthlyContribution) / Math.max(1, Number(portfolio.totalValue))) * 1000)
    );

    return prisma.analyticsSnapshot.create({
      data: {
        userId,
        netWorth: portfolio.totalValue,
        monthlySavings: portfolio.monthlyContribution,
        score,
      },
    });
  },
};