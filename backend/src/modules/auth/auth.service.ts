import { prisma } from "../../lib/prisma";

type RegisterInput = {
  email: string;
  fullName: string;
};

export const authService = {
  async register(input: RegisterInput) {
    return prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });
  },

  async login(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    return {
      token: `demo-token-${user.id}`,
      user,
    };
  },
};