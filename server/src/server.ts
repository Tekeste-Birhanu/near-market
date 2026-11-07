import { createApp } from "./app.ts";
import { ConfigurationError, loadConfig } from "./config.ts";
import { createDatabaseClient } from "./database.ts";
import { loadProjectEnv } from "./load-env.ts";
import { createPrismaUserRepository } from "./auth/user-repository.ts";
import { createMarketplaceBot } from "./bots/marketplace.ts";

async function startServer(): Promise<void> {
  loadProjectEnv();
  const config = loadConfig();
  const prisma = config.databaseUrl ? createDatabaseClient(config.databaseUrl) : undefined;
  const app = createApp(config, {
    auth: {
      sessionSecret: config.sessionSecret,
      userRepository: prisma ? createPrismaUserRepository(prisma) : undefined,
      botTokens: [config.marketplaceBotToken, config.adminBotToken].filter(
        (token): token is string => Boolean(token),
      ),
    },
  });

  app.listen(config.port, () => {
    console.info(`API server listening on port ${config.port}`);
  });

  if (config.marketplaceBotEnabled && config.marketplaceBotToken && config.marketplaceMiniAppUrl) {
    const marketplaceBot = createMarketplaceBot(config.marketplaceBotToken, config.marketplaceMiniAppUrl);
    process.once("SIGINT", () => marketplaceBot.stop("SIGINT"));
    process.once("SIGTERM", () => marketplaceBot.stop("SIGTERM"));
    void marketplaceBot.launch()
      .then(() => console.info("Marketplace bot started."))
      .catch(() => console.error("Marketplace bot failed to connect; API remains available."));
  }
}

startServer().catch((error: unknown) => {
  if (error instanceof ConfigurationError) {
    console.error(error.message);
  } else {
    console.error("Server startup failed.");
  }
  process.exitCode = 1;
});
