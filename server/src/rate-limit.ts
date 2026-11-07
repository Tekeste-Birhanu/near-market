import type { RequestHandler } from "express";

interface WindowEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(maxRequests: number, windowMs: number): RequestHandler {
  const clients = new Map<string, WindowEntry>();
  let requestsSinceCleanup = 0;

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    entry.count += 1;
    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 256) {
      for (const [clientKey, clientEntry] of clients) {
        if (clientEntry.resetAt <= now) clients.delete(clientKey);
      }
      requestsSinceCleanup = 0;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader("RateLimit-Limit", maxRequests);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      });
      return;
    }

    next();
  };
}
