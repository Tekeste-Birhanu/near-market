import { createHmac, timingSafeEqual } from "node:crypto";

export const TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 5 * 60;
const FUTURE_CLOCK_SKEW_SECONDS = 30;
const MAX_INIT_DATA_LENGTH = 16_384;

export interface TelegramMiniAppUser {
  telegramUserId: bigint;
  telegramUsername: string | null;
  displayName: string;
}

function safeHexEqual(left: string, right: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(left) || !/^[a-f\d]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function validUserJson(value: string): TelegramMiniAppUser | undefined {
  let user: unknown;
  try {
    user = JSON.parse(value);
  } catch {
    return undefined;
  }
  if (!user || typeof user !== "object") return undefined;

  const record = user as Record<string, unknown>;
  if (!Number.isSafeInteger(record.id) || typeof record.id !== "number" || record.id <= 0) {
    return undefined;
  }
  if (typeof record.first_name !== "string") return undefined;
  if (record.last_name !== undefined && typeof record.last_name !== "string") return undefined;
  if (record.username !== undefined && typeof record.username !== "string") return undefined;

  const displayName = [record.first_name, record.last_name]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .trim();
  if (!displayName) return undefined;

  const username = typeof record.username === "string" ? record.username.trim() : "";
  return {
    telegramUserId: BigInt(record.id),
    telegramUsername: username || null,
    displayName,
  };
}

export function validateTelegramInitData(
  rawInitData: string,
  botTokens: readonly string[],
  nowMs = Date.now(),
): TelegramMiniAppUser | undefined {
  if (!rawInitData || rawInitData.length > MAX_INIT_DATA_LENGTH || botTokens.length === 0) {
    return undefined;
  }

  const params = new URLSearchParams(rawInitData);
  const entries = [...params.entries()];
  if (entries.length === 0 || new Set(entries.map(([key]) => key)).size !== entries.length) {
    return undefined;
  }

  const receivedHash = params.get("hash");
  if (!receivedHash || !/^[a-f\d]{64}$/i.test(receivedHash)) return undefined;

  const dataCheckString = entries
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  let signatureValid = false;
  for (const botToken of botTokens) {
    const secretKey = createHmac("sha256", botToken).update("WebAppData").digest();
    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    signatureValid = safeHexEqual(calculatedHash, receivedHash) || signatureValid;
  }
  if (!signatureValid) return undefined;

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw || !/^\d+$/.test(authDateRaw)) return undefined;
  const authDate = Number(authDateRaw);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (
    !Number.isSafeInteger(authDate) ||
    authDate > nowSeconds + FUTURE_CLOCK_SKEW_SECONDS ||
    nowSeconds - authDate > TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
  ) {
    return undefined;
  }

  const userJson = params.get("user");
  if (!userJson) return undefined;
  return validUserJson(userJson);
}
