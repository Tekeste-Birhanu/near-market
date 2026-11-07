import { Router, type Request, type Response } from "express";
import { issueAccessToken } from "./session-token.ts";
import { validateTelegramInitData } from "./telegram-init-data.ts";
import type { AuthUserRepository } from "./user-repository.ts";

export interface AuthSessionDependencies {
  botTokens?: readonly string[];
  sessionSecret?: string;
  userRepository?: AuthUserRepository;
  now?: () => number;
}

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

export function createAuthRouter(dependencies: AuthSessionDependencies = {}) {
  const router = Router();

  router.post("/session", async (req: Request, res: Response) => {
    if (
      !dependencies.botTokens?.length ||
      !dependencies.sessionSecret ||
      !dependencies.userRepository
    ) {
      sendError(res, 503, "AUTHENTICATION_UNAVAILABLE", "Authentication is not configured.");
      return;
    }

    const body: unknown = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !("initData" in body) ||
      typeof body.initData !== "string"
    ) {
      sendError(res, 400, "VALIDATION_ERROR", "Provide only the raw Telegram initData string.");
      return;
    }

    const now = dependencies.now?.() ?? Date.now();
    const telegramUser = validateTelegramInitData(body.initData, dependencies.botTokens, now);
    if (!telegramUser) {
      sendError(res, 401, "UNAUTHORIZED", "Telegram authentication data is invalid or expired.");
      return;
    }

    const user = await dependencies.userRepository.upsertTelegramUser(telegramUser);
    const session = issueAccessToken(user.id, dependencies.sessionSecret, now);
    res.status(200).json({
      accessToken: session.accessToken,
      expiresAt: session.expiresAt.toISOString(),
      user,
    });
  });

  return router;
}
