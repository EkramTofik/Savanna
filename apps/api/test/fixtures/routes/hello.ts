// Dropped-in route used by the test: no edits to the skeleton needed.
import type { Router } from "express";
import { z } from "zod";
import { requireScope } from "../../../src/middleware/auth";
import type { Ctx } from "../../../src/lib/context";

export function register(router: Router, _ctx: Ctx) {
  router.get("/hello", (_req, res) => res.json({ hello: "world" }));
  router.post("/echo", (req, res) => {
    const body = z.object({ name: z.string().min(1) }).parse(req.body);
    res.json(body);
  });
  router.post("/admin-only", requireScope("admin"), (_req, res) => res.json({ ok: true }));
}
