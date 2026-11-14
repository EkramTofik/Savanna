import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { AppConfig, Partner } from "../lib/context";
import { HttpError } from "../lib/errors";

export interface Auth {
  scope: "read" | "admin";
  partner: Partner | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: Auth;
    }
  }
}

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function originAllowed(origin: string, origins: string[], production: boolean): boolean {
  return origins.includes(origin) || (!production && LOCALHOST.test(origin));
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checks X-Savanna-Key. Publishable key = read scope (and origin allow-list). Secret key = admin scope. */
export function authenticate(config: AppConfig) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.header("x-savanna-key");
    if (!key) throw new HttpError(401, "Unauthorized", "Missing X-Savanna-Key header.");

    if (safeEqual(key, config.secretKey)) {
      req.auth = { scope: "admin", partner: null };
      return next();
    }

    const partner = config.partners.find((p) => safeEqual(key, p.key));
    if (!partner) throw new HttpError(401, "Unauthorized", "Invalid API key.");

    const origin = req.header("origin");
    if (origin && !originAllowed(origin, partner.origins, config.production)) {
      throw new HttpError(403, "Forbidden", "This key is not allowed from this origin.");
    }
    req.auth = { scope: "read", partner };
    next();
  };
}

/** Use on a route that needs the secret key: router.post("/x", requireScope("admin"), handler) */
export function requireScope(scope: Auth["scope"]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (scope === "admin" && req.auth?.scope !== "admin") {
      throw new HttpError(403, "Forbidden", "This action needs the secret key.");
    }
    next();
  };
}
