import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export interface SessionClaims {
  userId: string;
  expiresAt: number;
}

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
}

function sign(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

export function issueAccessToken(userId: string, secret: string, nowMs = Date.now()): {
  accessToken: string;
  expiresAt: Date;
} {
  const issuedAt = Math.floor(nowMs / 1000);
  const payload: TokenPayload = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `v1.${encodedPayload}`;
  const signature = sign(signingInput, secret).toString("base64url");

  return {
    accessToken: `${signingInput}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export function verifyAccessToken(token: string, secret: string, nowMs = Date.now()): SessionClaims | undefined {
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    parts[0] !== "v1" ||
    !/^[A-Za-z0-9_-]+$/.test(parts[1]) ||
    !/^[A-Za-z0-9_-]+$/.test(parts[2])
  ) {
    return undefined;
  }

  const signingInput = `${parts[0]}.${parts[1]}`;
  const expectedSignature = sign(signingInput, secret);
  const receivedSignature = Buffer.from(parts[2], "base64url");
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return undefined;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
  if (!payload || typeof payload !== "object") return undefined;

  const record = payload as Partial<TokenPayload>;
  if (
    typeof record.sub !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.sub) ||
    !Number.isSafeInteger(record.exp) ||
    !Number.isSafeInteger(record.iat) ||
    typeof record.nonce !== "string" ||
    record.exp! <= Math.floor(nowMs / 1000) ||
    record.iat! > Math.floor(nowMs / 1000) + 30
  ) {
    return undefined;
  }

  return { userId: record.sub, expiresAt: record.exp! };
}

export function requireSession(secret?: string, now: () => number = Date.now): RequestHandler {
  return (req, res, next) => {
    if (!secret) {
      res.status(503).json({
        error: { code: "AUTHENTICATION_UNAVAILABLE", message: "Authentication is not configured." },
      });
      return;
    }

    const authorization = req.get("authorization") ?? "";
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    const claims = match ? verifyAccessToken(match[1], secret, now()) : undefined;
    if (!claims) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "A valid API access token is required." },
      });
      return;
    }

    res.locals.authenticatedUserId = claims.userId;
    next();
  };
}
