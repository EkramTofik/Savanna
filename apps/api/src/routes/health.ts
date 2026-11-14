// Public route: mounted at the root with full paths, no API key needed.
import type { Router } from "express";
import type { Ctx } from "../lib/context";

export const access = "public" as const;

export function register(router: Router, _ctx: Ctx) {
  router.get("/v1/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });
}
