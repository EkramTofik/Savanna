import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import type { CareerCtx, CredentialRecord } from "./career-types.js";
import { effectiveStatus, problem, requirePublishable, requireSecret } from "./career-lib.js";
import { toOpenBadge } from "./open-badges.js";

const issueBody = z.object({
  recipientRef: z.string().min(1).max(200),
  achievement: z.string().min(1).max(200),
  recipientName: z.string().min(1).max(200).optional(),
  expiresAt: z.string().datetime().optional(),
});

export function newCredentialId(): string {
  return randomBytes(16).toString("hex");
}

export function register(router: Router, ctx: CareerCtx): void {
  router.post("/v1/credentials", requireSecret(ctx), async (req, res, next) => {
    try {
      const parsed = issueBody.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 400, "Invalid request", "Check recipientRef and achievement.", {
          issues: parsed.error.issues,
        });
        return;
      }
      const now = new Date().toISOString();
      const record: CredentialRecord = {
        id: newCredentialId(),
        recipientRef: parsed.data.recipientRef,
        recipientName: parsed.data.recipientName ?? null,
        achievement: parsed.data.achievement,
        issuedAt: now,
        validFrom: now,
        expiresAt: parsed.data.expiresAt ?? null,
        status: "valid",
        proof: null,
      };
      const badge = toOpenBadge(record, ctx);
      record.proof = (badge.proof as CredentialRecord["proof"]) ?? null;
      const saved = await ctx.store.saveCredential(record);
      res.status(201).type("application/ld+json").json(toOpenBadge(saved, ctx));
    } catch (err) {
      next(err);
    }
  });

  router.get("/v1/credentials/:id", requirePublishable(ctx), async (req, res, next) => {
    try {
      const record = await ctx.store.getCredential(req.params.id);
      if (!record) {
        problem(res, 404, "Not Found", `Credential ${req.params.id} was not found.`);
        return;
      }
      res.type("application/ld+json").json(toOpenBadge(record, ctx));
    } catch (err) {
      next(err);
    }
  });

  router.get("/v1/credentials/:id/pdf", requirePublishable(ctx), async (req, res, next) => {
    try {
      const record = await ctx.store.getCredential(req.params.id);
      if (!record) {
        problem(res, 404, "Not Found", `Credential ${req.params.id} was not found.`);
        return;
      }
      const { renderCertificatePdf } = await import("./credential-pdf.js");
      const pdf = await renderCertificatePdf(record, ctx);
      res
        .type("application/pdf")
        .set("Content-Disposition", `attachment; filename="credential-${record.id}.pdf"`)
        .send(pdf);
    } catch (err) {
      next(err);
    }
  });

  router.post("/v1/credentials/:id/revoke", requireSecret(ctx), async (req, res, next) => {
    try {
      const record = await ctx.store.getCredential(req.params.id);
      if (!record) {
        problem(res, 404, "Not Found", `Credential ${req.params.id} was not found.`);
        return;
      }
      record.status = "revoked";
      const saved = await ctx.store.saveCredential(record);
      res.json({
        id: saved.id,
        status: effectiveStatus(saved),
      });
    } catch (err) {
      next(err);
    }
  });
}

export const openapi = {
  paths: {
    "/v1/credentials": {
      post: {
        summary: "Issue a credential (secret key)",
        tags: ["Credentials"],
        responses: { "201": { description: "Issued OpenBadgeCredential" } },
      },
    },
    "/v1/credentials/{id}": {
      get: {
        summary: "Fetch a credential as JSON-LD",
        tags: ["Credentials"],
        responses: { "200": { description: "OpenBadgeCredential" } },
      },
    },
    "/v1/credentials/{id}/pdf": {
      get: {
        summary: "Tagged certificate PDF (FR-D3)",
        tags: ["Credentials"],
        responses: { "200": { description: "application/pdf" } },
      },
    },
    "/v1/credentials/{id}/revoke": {
      post: {
        summary: "Revoke a credential (secret key)",
        tags: ["Credentials"],
        responses: { "200": { description: "Revoked" } },
      },
    },
  },
};
