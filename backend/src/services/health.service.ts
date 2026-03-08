import { prisma } from "../lib/prisma";

type ServiceState = "up" | "down";

export const healthService = {
  async getHealthStatus() {
    let database: ServiceState = "up";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "down";
    }

    return {
      status: database === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        api: "up" as const,
        database,
      },
    };
  },
};
