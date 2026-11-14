// Optional preference sync (contract C3). The host platform supplies an opaque per-user token in
// X-Savanna-User (16+ characters, treat it like a password). We store only its SHA-256 hash.
//   GET /v1/preferences -> the preferences object ({} if none yet)
//   PUT /v1/preferences -> replaces it; body = the whole object, e.g. { "captions": { "size": 150 } }
import { createHash } from "node:crypto";
import type { Request, Router } from "express";
import { HttpError } from "../lib/errors";
import type { Ctx } from "../lib/context";
import { z } from "zod";
import type { OperationDoc } from "../lib/openapi";
import { PreferencesSchema } from "../schemas/preferences";

function userHash(req: Request): string {
  const token = req.header("x-savanna-user");
  if (!token || token.length < 16 || token.length > 200) {
    throw new HttpError(400, "Missing user token", "Send X-Savanna-User: an opaque id of 16+ characters that your platform issues per user.");
  }
  return createHash("sha256").update(token).digest("hex");
}

export function register(router: Router, ctx: Ctx) {
  router.get("/preferences", async (req, res) => {
    res.json((await ctx.store.getPreferences(userHash(req))) ?? {});
  });

  router.put("/preferences", async (req, res) => {
    const hash = userHash(req);
    const prefs = PreferencesSchema.parse(req.body);
    await ctx.store.setPreferences(hash, prefs);
    res.json(prefs);
  });
}

const UserHeader = z.object({
  "X-Savanna-User": z.string().min(16).max(200).describe("Opaque per-user id (16+ characters) issued by the host platform. Treat it like a password; only its hash is stored."),
});

export const openapi: OperationDoc[] = [
  {
    method: "get", path: "/preferences", summary: "Get a user's saved preferences", tags: ["Preferences"],
    headers: UserHeader,
    responses: { 200: { description: "The preferences object ({} if none saved yet).", schema: PreferencesSchema } },
  },
  {
    method: "put", path: "/preferences", summary: "Save a user's preferences", tags: ["Preferences"],
    description: "Replaces the whole object. Each owner writes only their own namespace (contract C3).",
    headers: UserHeader, body: PreferencesSchema,
    responses: { 200: { description: "The saved preferences.", schema: PreferencesSchema } },
  },
];
