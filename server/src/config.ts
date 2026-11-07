export interface AppConfig {
  port: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  databaseUrl?: string;
  sessionSecret?: string;
  marketplaceBotEnabled: boolean;
  marketplaceBotToken?: string;
  marketplaceMiniAppUrl?: string;
  adminBotToken?: string;
}

export class ConfigurationError extends Error {
  constructor(variable: string) {
    super(`Invalid configuration for ${variable}`);
    this.name = "ConfigurationError";
  }
}

function positiveInteger(
  value: string | undefined,
  fallback: number,
  variable: string,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new ConfigurationError(variable);

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ConfigurationError(variable);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const marketplaceBotEnabledValue = env.MARKETPLACE_BOT_ENABLED ?? "false";
  if (marketplaceBotEnabledValue !== "true" && marketplaceBotEnabledValue !== "false") {
    throw new ConfigurationError("MARKETPLACE_BOT_ENABLED");
  }

  const config: AppConfig = {
    port: positiveInteger(env.PORT, 3000, "PORT", 65_535),
    rateLimitWindowMs: positiveInteger(env.RATE_LIMIT_WINDOW_MS, 60_000, "RATE_LIMIT_WINDOW_MS"),
    rateLimitMax: positiveInteger(env.RATE_LIMIT_MAX, 100, "RATE_LIMIT_MAX"),
    marketplaceBotEnabled: marketplaceBotEnabledValue === "true",
  };

  if (env.DATABASE_URL) {
    try {
      const url = new URL(env.DATABASE_URL);
      if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        throw new Error("unsupported protocol");
      }
    } catch {
      throw new ConfigurationError("DATABASE_URL");
    }
    config.databaseUrl = env.DATABASE_URL;
  }

  if (env.SESSION_SECRET) {
    if (Buffer.byteLength(env.SESSION_SECRET, "utf8") < 32) {
      throw new ConfigurationError("SESSION_SECRET");
    }
    config.sessionSecret = env.SESSION_SECRET;
  }

  if (env.MARKETPLACE_BOT_TOKEN) config.marketplaceBotToken = env.MARKETPLACE_BOT_TOKEN;
  if (env.ADMIN_BOT_TOKEN) config.adminBotToken = env.ADMIN_BOT_TOKEN;

  if (config.marketplaceBotEnabled) {
    if (!config.marketplaceBotToken || !/^\d+:[A-Za-z0-9_-]{20,}$/.test(config.marketplaceBotToken)) {
      throw new ConfigurationError("MARKETPLACE_BOT_TOKEN");
    }
    if (!env.MARKETPLACE_MINI_APP_URL) throw new ConfigurationError("MARKETPLACE_MINI_APP_URL");
    try {
      const url = new URL(env.MARKETPLACE_MINI_APP_URL);
      if (url.protocol !== "https:" || url.username || url.password || url.hash) {
        throw new Error("unsupported Mini App URL");
      }
      config.marketplaceMiniAppUrl = url.toString();
    } catch {
      throw new ConfigurationError("MARKETPLACE_MINI_APP_URL");
    }
  }

  return config;
}
