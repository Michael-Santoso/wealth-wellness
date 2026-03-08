import { prisma } from "../../lib/prisma";

export const recommendationsService = {
  async getForUser(userId: string) {
    const existing = await prisma.recommendation.findMany({
      where: { userId },
      orderBy: { priority: "asc" },
      take: 3,
    });

    if (existing.length > 0) {
      return existing;
    }

    const seed = [
      {
        title: "Build your emergency fund",
        detail: "Target 3-6 months of expenses in a high-yield savings account.",
        priority: 1,
      },
      {
        title: "Increase diversified exposure",
        detail: "Allocate a fixed monthly amount into low-cost broad-market ETFs.",
        priority: 2,
      },
      {
        title: "Rebalance quarterly",
        detail: "Review allocation drift and rebalance based on your risk profile.",
        priority: 3,
      },
    ];

    await prisma.recommendation.createMany({
      data: seed.map((item) => ({ ...item, userId })),
    });

    return prisma.recommendation.findMany({
      where: { userId },
      orderBy: { priority: "asc" },
      take: 3,
    });
  },
};