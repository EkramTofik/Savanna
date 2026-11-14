// Contract C7: every route module receives this as its second argument.
// Additive changes only: add fields, never rename or remove.
import type { Router } from "express";
import type { Store } from "../db/store";

export interface Partner {
  name: string;
  /** Publishable key (read-only, safe to ship in a browser). */
  key: string;
  /** Origins allowed to use this key from a browser. */
  origins: string[];
}

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl?: string;
  production: boolean;
  /** Server-to-server key for admin actions (issue/revoke credentials, etc.). */
  secretKey: string;
  partners: Partner[];
  rateLimitPerMin: number;
  /** "memory" (default in dev, no database needed) or "prisma" (PostgreSQL). */
  store: "memory" | "prisma";
}

// Replace `unknown` with the generated PrismaClient type once Prisma is set up (task 4.3).
export interface Ctx {
  prisma: unknown;
  /** Content store (lessons, transcripts, preferences). Added in task 4.3. */
  store: Store;
  config: AppConfig;
}

export type RegisterRoutes = (router: Router, ctx: Ctx) => void;

/**
 * What a file in src/routes/ must export.
 *  - register(router, ctx)  (required)
 *  - access: "key" (default) -> mounted under /v1 behind X-Savanna-Key auth;
 *            register paths WITHOUT /v1, e.g. router.get("/lessons/:id", ...)
 *            "public"        -> mounted at the root, no auth; use FULL paths,
 *            e.g. router.get("/v1/health", ...) or router.get("/verify/:id", ...)
 */
export interface RouteModule {
  register: RegisterRoutes;
  access?: "key" | "public";
}
