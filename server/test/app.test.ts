import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { loadConfig } from "../src/config.ts";

const testConfig = { rateLimitMax: 100, rateLimitWindowMs: 60_000 };

describe("API app", () => {
  it("responds to the health check without opening a port", async () => {
    const response = await request(createApp(testConfig)).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("uses the standard error envelope for unknown routes", async () => {
    const response = await request(createApp(testConfig)).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("returns a generic validation error for malformed JSON", async () => {
    const response = await request(createApp(testConfig))
      .post("/anything")
      .set("Content-Type", "application/json")
      .send("{");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: "VALIDATION_ERROR", message: "The request could not be accepted." },
    });
    expect(JSON.stringify(response.body)).not.toContain("Unexpected end");
  });

  it("returns the API error envelope after the configured per-IP limit", async () => {
    const app = createApp({ rateLimitMax: 1, rateLimitWindowMs: 60_000 });

    expect((await request(app).get("/health")).status).toBe(200);
    const response = await request(app).get("/health");

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." },
    });
    expect(response.headers["retry-after"]).toBeDefined();
  });
});

describe("loadConfig", () => {
  it("uses safe defaults", () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      rateLimitWindowMs: 60_000,
      rateLimitMax: 100,
      marketplaceBotEnabled: false,
    });
  });

  it("reports invalid variable names without echoing values", () => {
    const secretishValue = "secret-value";
    let message = "";
    try {
      loadConfig({ PORT: secretishValue });
    } catch (error) {
      message = error instanceof Error ? error.message : "";
    }
    expect(message).toBe("Invalid configuration for PORT");
    expect(message).not.toContain(secretishValue);
  });

  it("requires a sufficiently long session secret when configured", () => {
    expect(() => loadConfig({ SESSION_SECRET: "too-short" })).toThrow(
      "Invalid configuration for SESSION_SECRET",
    );
    expect(loadConfig({ SESSION_SECRET: "x".repeat(32) }).sessionSecret).toBe("x".repeat(32));
  });

  it("allows local API configuration without enabling or configuring a bot", () => {
    expect(loadConfig({ DATABASE_URL: "postgresql://localhost/near_market" }).marketplaceBotEnabled).toBe(false);
  });

  it("requires a valid server token and HTTPS Mini App URL when bot startup is enabled", () => {
    const token = `123456:${"a".repeat(35)}`;
    expect(() => loadConfig({ MARKETPLACE_BOT_ENABLED: "true" })).toThrow(
      "Invalid configuration for MARKETPLACE_BOT_TOKEN",
    );
    expect(() => loadConfig({
      MARKETPLACE_BOT_ENABLED: "true",
      MARKETPLACE_BOT_TOKEN: "not-a-token",
      MARKETPLACE_MINI_APP_URL: "https://mini.example.org/",
    })).toThrow("Invalid configuration for MARKETPLACE_BOT_TOKEN");
    expect(() => loadConfig({
      MARKETPLACE_BOT_ENABLED: "true",
      MARKETPLACE_BOT_TOKEN: token,
      MARKETPLACE_MINI_APP_URL: "http://localhost:5173",
    })).toThrow("Invalid configuration for MARKETPLACE_MINI_APP_URL");
    expect(loadConfig({
      MARKETPLACE_BOT_ENABLED: "true",
      MARKETPLACE_BOT_TOKEN: token,
      MARKETPLACE_MINI_APP_URL: "https://mini.example.org/",
    })).toMatchObject({
      marketplaceBotEnabled: true,
      marketplaceBotToken: token,
      marketplaceMiniAppUrl: "https://mini.example.org/",
    });
  });
});
