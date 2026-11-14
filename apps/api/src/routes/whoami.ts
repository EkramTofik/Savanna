// Key-protected example: mounted under /v1, so the full URL is GET /v1/whoami.
// Handy for checking that a key works. Safe to delete once real routes exist.
import type { Router } from "express";
import type { Ctx } from "../lib/context";

export function register(router: Router, _ctx: Ctx) {
  router.get("/whoami", (req, res) => {
    res.json({ scope: req.auth?.scope, partner: req.auth?.partner?.name ?? null });
  });
}
