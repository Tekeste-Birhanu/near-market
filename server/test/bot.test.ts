import { describe, expect, it, vi } from "vitest";
import { marketplaceLaunchKeyboard, registerMarketplaceLaunchCommands } from "../src/bots/marketplace.ts";
import type { Context, Telegraf } from "telegraf";

describe("marketplace bot launch action", () => {
  it("creates an inline Mini App button pointing at the configured Marketplace URL", () => {
    const url = "https://near-market-dev.example.org/";
    const keyboard = marketplaceLaunchKeyboard(url);

    expect(keyboard.reply_markup.inline_keyboard).toMatchObject([[
      { text: "Open Near Market", web_app: { url } },
    ]]);
  });

  it("returns the Mini App launch button for both /start and /app without Telegram network calls", async () => {
    const handlers = new Map<string, (ctx: Context) => unknown>();
    const fakeBot = {
      start: (handler: (ctx: Context) => unknown) => handlers.set("start", handler),
      command: (command: string, handler: (ctx: Context) => unknown) => handlers.set(command, handler),
    } as unknown as Telegraf;
    const url = "https://near-market-dev.example.org/";
    const reply = vi.fn().mockResolvedValue(undefined);
    registerMarketplaceLaunchCommands(fakeBot, url);

    for (const command of ["start", "app"]) {
      await handlers.get(command)?.({ reply } as unknown as Context);
      expect(reply.mock.lastCall?.[1].reply_markup.inline_keyboard).toMatchObject([[
        { text: "Open Near Market", web_app: { url } },
      ]]);
    }
    expect(reply).toHaveBeenCalledTimes(2);
  });
});
