import { createHmac } from "node:crypto";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.ts";
import { issueAccessToken, requireSession, verifyAccessToken } from "../src/auth/session-token.ts";
import { validateTelegramInitData } from "../src/auth/telegram-init-data.ts";
import type { AuthUserRepository } from "../src/auth/user-repository.ts";

const botToken = "123456:test-bot-token";
const sessionSecret = "local-test-session-secret-32-characters-minimum";
const now = 1_800_000_000_000;

function signedInitData(
  user: Record<string, unknown>,
  authDate = Math.floor(now / 1000),
  token = botToken,
): string {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    user: JSON.stringify(user),
  });
  const checkString = [...params.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", token).update("WebAppData").digest();
  params.set("hash", createHmac("sha256", secretKey).update(checkString).digest("hex"));
  return params.toString();
}

function makeRepository(): AuthUserRepository & {
  upsertTelegramUser: ReturnType<typeof vi.fn>;
} {
  return {
    upsertTelegramUser: vi.fn(async (telegramUser) => ({
      id: "dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2",
      telegramUsername: telegramUser.telegramUsername,
      displayName: telegramUser.displayName,
      phoneNumber: null,
      isAdmin: false,
    })),
  };
}

function authApp(userRepository: AuthUserRepository) {
  return createApp(
    { rateLimitMax: 100, rateLimitWindowMs: 60_000 },
    { auth: { botTokens: [botToken], sessionSecret, userRepository, now: () => now } },
  );
}

describe("Telegram Mini App session endpoint", () => {
  const user = { id: 541234567, first_name: "Seller", last_name: "Name", username: "seller_name" };

  it("validates Telegram initData, upserts the user, and issues a bearer token", async () => {
    const repository = makeRepository();
    const response = await request(authApp(repository)).post("/api/v1/auth/session").send({
      initData: signedInitData(user),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
      user: {
        id: "dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2",
        telegramUsername: "seller_name",
        displayName: "Seller Name",
        phoneNumber: null,
        isAdmin: false,
      },
    });
    expect(typeof response.body.accessToken).toBe("string");
    const tokenPayload = JSON.parse(Buffer.from(response.body.accessToken.split(".")[1], "base64url").toString());
    expect(tokenPayload.sub).toBe("dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2");
    expect(tokenPayload).not.toHaveProperty("isAdmin");
    expect(repository.upsertTelegramUser).toHaveBeenCalledWith({
      telegramUserId: 541234567n,
      telegramUsername: "seller_name",
      displayName: "Seller Name",
    });
  });

  it("rejects tampered initData without upserting a user", async () => {
    const repository = makeRepository();
    const initData = `${signedInitData(user)}&admin=true`;
    const response = await request(authApp(repository)).post("/api/v1/auth/session").send({ initData });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(repository.upsertTelegramUser).not.toHaveBeenCalled();
  });

  it("rejects expired initData", async () => {
    const repository = makeRepository();
    const oldAuthDate = Math.floor(now / 1000) - 5 * 60 - 1;
    const response = await request(authApp(repository))
      .post("/api/v1/auth/session")
      .send({ initData: signedInitData(user, oldAuthDate) });

    expect(response.status).toBe(401);
    expect(repository.upsertTelegramUser).not.toHaveBeenCalled();
  });

  it("allows a username-less user to browse by issuing a normal session", async () => {
    const repository = makeRepository();
    const response = await request(authApp(repository))
      .post("/api/v1/auth/session")
      .send({ initData: signedInitData({ id: 541234568, first_name: "Browser" }) });

    expect(response.status).toBe(200);
    expect(response.body.user.telegramUsername).toBeNull();
    expect(response.body.user.displayName).toBe("Browser");
  });

  it("does not accept client-supplied identity or admin fields", async () => {
    const repository = makeRepository();
    const response = await request(authApp(repository))
      .post("/api/v1/auth/session")
      .send({ initData: signedInitData(user), userId: "forged", isAdmin: true });

    expect(response.status).toBe(400);
    expect(repository.upsertTelegramUser).not.toHaveBeenCalled();
  });

  it("fails safely when required authentication configuration is missing", async () => {
    const response = await request(createApp({ rateLimitMax: 100, rateLimitWindowMs: 60_000 }))
      .post("/api/v1/auth/session")
      .send({ initData: signedInitData(user) });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("AUTHENTICATION_UNAVAILABLE");
  });
});

describe("Telegram initData validation", () => {
  it("accepts valid data signed by either configured bot", () => {
    const otherBotToken = "987654:admin-test-token";
    const initData = signedInitData({ id: 123, first_name: "Valid" }, undefined, otherBotToken);

    expect(validateTelegramInitData(initData, [botToken, otherBotToken], now)?.displayName).toBe("Valid");
  });

  it("rejects duplicate parameters and future timestamps", () => {
    const initData = signedInitData({ id: 123, first_name: "Valid" });
    expect(validateTelegramInitData(`${initData}&auth_date=${Math.floor(now / 1000)}`, [botToken], now)).toBeUndefined();
    expect(
      validateTelegramInitData(
        signedInitData({ id: 123, first_name: "Valid" }, Math.floor(now / 1000) + 31),
        [botToken],
        now,
      ),
    ).toBeUndefined();
  });
});

describe("API access tokens", () => {
  it("verifies a valid token and rejects altered or expired tokens", () => {
    const issued = issueAccessToken("dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2", sessionSecret, now);
    const [version, payload, signature] = issued.accessToken.split(".");

    expect(verifyAccessToken(issued.accessToken, sessionSecret, now)?.userId).toBe(
      "dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2",
    );
    const changedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;
    expect(verifyAccessToken(`${version}.${payload}.${changedSignature}`, sessionSecret, now)).toBeUndefined();
    expect(verifyAccessToken(issued.accessToken, sessionSecret, issued.expiresAt.getTime())).toBeUndefined();
  });

  it("protects API routes with the bearer token", async () => {
    const issued = issueAccessToken("dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2", sessionSecret, now);
    const app = express();
    app.get("/protected", requireSession(sessionSecret, () => now), (_req, res) => {
      res.json({ userId: res.locals.authenticatedUserId });
    });

    expect((await request(app).get("/protected")).status).toBe(401);
    const response = await request(app).get("/protected").set("Authorization", `Bearer ${issued.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.userId).toBe("dd7320bd-8c00-42da-9ee8-5fe6bcba7cf2");
  });
});
