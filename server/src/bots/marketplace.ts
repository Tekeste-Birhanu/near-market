import { Markup, Telegraf, type Context } from "telegraf";

export function createMarketplaceBot(token: string, miniAppUrl: string): Telegraf {
  const bot = new Telegraf(token);
  registerMarketplaceLaunchCommands(bot, miniAppUrl);
  bot.catch(() => {
    console.error("Marketplace bot update failed.");
  });

  return bot;
}

export function registerMarketplaceLaunchCommands(bot: Telegraf, miniAppUrl: string): void {
  const launchApp = (ctx: Context) =>
    ctx.reply(
      "Welcome to Near Market. Browse items and house rentals, or post your own listing.",
      marketplaceLaunchKeyboard(miniAppUrl),
    );

  bot.start(launchApp);
  bot.command("app", launchApp);
}

export function marketplaceLaunchKeyboard(miniAppUrl: string) {
  return Markup.inlineKeyboard([Markup.button.webApp("Open Near Market", miniAppUrl)]);
}
