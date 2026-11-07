import express, { type ErrorRequestHandler } from "express";
import type { AppConfig } from "./config.ts";
import { createAuthRouter, type AuthSessionDependencies } from "./auth/session-route.ts";
import { requireSession } from "./auth/session-token.ts";
import { createRateLimiter } from "./rate-limit.ts";

export interface AppDependencies {
  auth?: AuthSessionDependencies;
}

export function createApp(
  config: Pick<AppConfig, "rateLimitMax" | "rateLimitWindowMs">,
  dependencies: AppDependencies = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(createRateLimiter(config.rateLimitMax, config.rateLimitWindowMs));
  app.use("/api/v1/auth", createAuthRouter(dependencies.auth));
  app.use("/api/v1", requireSession(dependencies.auth?.sessionSecret));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "The requested resource was not found." },
    });
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const status =
      typeof error === "object" && error !== null && "status" in error &&
      (error.status === 400 || error.status === 413)
        ? error.status
        : 500;
    const code = status === 400 ? "VALIDATION_ERROR" : status === 413 ? "PAYLOAD_TOO_LARGE" : "INTERNAL_ERROR";
    const message = status === 400
      ? "The request could not be accepted."
      : status === 413
        ? "The request exceeds the allowed size."
        : "An unexpected error occurred.";

    if (status === 500) console.error("Unhandled API error");
    res.status(status).json({ error: { code, message } });
  };

  app.use(errorHandler);
  return app;
}
