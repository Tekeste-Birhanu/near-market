import type { PrismaClient } from "../../generated/prisma/client.ts";
import type { TelegramMiniAppUser } from "./telegram-init-data.ts";

export interface AuthenticatedUser {
  id: string;
  telegramUsername: string | null;
  displayName: string;
  phoneNumber: string | null;
  isAdmin: boolean;
}

export interface AuthUserRepository {
  upsertTelegramUser(user: TelegramMiniAppUser): Promise<AuthenticatedUser>;
}

export function createPrismaUserRepository(prisma: PrismaClient): AuthUserRepository {
  return {
    async upsertTelegramUser(telegramUser) {
      const user = await prisma.user.upsert({
        where: { telegramUserId: telegramUser.telegramUserId },
        create: {
          telegramUserId: telegramUser.telegramUserId,
          telegramUsername: telegramUser.telegramUsername,
          displayName: telegramUser.displayName,
        },
        update: {
          telegramUsername: telegramUser.telegramUsername,
        },
        select: {
          id: true,
          telegramUsername: true,
          displayName: true,
          phoneNumber: true,
          isAdmin: true,
        },
      });

      return user;
    },
  };
}
