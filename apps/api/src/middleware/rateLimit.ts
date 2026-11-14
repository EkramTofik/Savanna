import rateLimit from "express-rate-limit";
import type { AppConfig } from "../lib/context";
import { sendProblem } from "../lib/errors";

/** In-memory counter (fine for one instance). Swap the store for Redis later without changing callers. */
export function limiter(config: AppConfig) {
  return rateLimit({
    windowMs: 60_000,
    limit: config.rateLimitPerMin,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.header("x-savanna-key") ?? req.ip ?? "anon",
    handler: (_req, res) => sendProblem(res, 429, "Too Many Requests", "Slow down and retry shortly."),
  });
}
