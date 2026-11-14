// Key-protected example: mounted under /v1, so the full URL is GET /v1/whoami.
// Handy for checking that a key works. Safe to delete once real routes exist.
import type { Router } from "express";
import { z } from "zod";
import type { Ctx } from "../lib/context";
import type { OperationDoc } from "../lib/openapi";

export function register(router: Router, _ctx: Ctx) {
  router.get("/whoami", (req, res) => {
    res.json({ scope: req.auth?.scope, partner: req.auth?.partner?.name ?? null });
  });
}

export const openapi: OperationDoc[] = [
  {
    method: "get", path: "/whoami", summary: "Check which key you are using", tags: ["Ops"],
    responses: {
      200: { description: "Scope of the key.", schema: z.object({ scope: z.enum(["read", "admin"]), partner: z.string().nullable() }) },
    },
  },
];
