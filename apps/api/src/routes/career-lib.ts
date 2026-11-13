import type { NextFunction, Request, Response } from "express";
import type { CareerCtx, JobRecord, Json } from "./career-types.js";

export function problem(
  res: Response,
  status: number,
  title: string,
  detail: string,
  extra: Json = {},
): void {
  res.status(status).type("application/problem+json").json({
    type: "about:blank",
    title,
    status,
    detail,
    ...extra,
  });
}

export function getKey(req: Request): string {
  const header = req.header("x-savanna-key") ?? "";
  if (header) return header;
  const q = req.query["api-key"];
  return typeof q === "string" ? q : "";
}

export function requirePublishable(ctx: CareerCtx) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    if (ctx.publishableKeys.has(key) || ctx.secretKeys.has(key)) {
      next();
      return;
    }
    problem(res, 401, "Unauthorized", "Provide a valid X-Savanna-Key.");
  };
}

export function requireSecret(ctx: CareerCtx) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    if (ctx.secretKeys.has(key)) {
      next();
      return;
    }
    problem(res, 401, "Unauthorized", "A secret key is required for this action.");
  };
}

export function jobToJsonLd(job: JobRecord, publicBaseUrl: string): Json {
  const apply = job.applyUrl.startsWith("http")
    ? job.applyUrl
    : `${publicBaseUrl}${job.applyUrl.startsWith("/") ? "" : "/"}${job.applyUrl}`;
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    identifier: job.id,
    title: job.title,
    description: `${job.description.en} Remote-friendly, screen-reader-tested application.`,
    datePosted: "2026-11-12",
    validThrough: job.validThrough ?? undefined,
    employmentType: job.employmentType ?? "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "ET",
      },
    },
    jobLocationType: job.remote ? "TELECOMMUTE" : "ON_SITE",
    url: apply,
    directApply: true,
  };
}

export function effectiveStatus(record: {
  status: string;
  expiresAt?: string | null;
}): "valid" | "revoked" | "expired" {
  if (record.status === "revoked") return "revoked";
  if (record.expiresAt && Date.parse(record.expiresAt) < Date.now()) return "expired";
  return record.status === "expired" ? "expired" : "valid";
}

export function wantsJsonLd(req: Request): boolean {
  const accept = req.header("accept") ?? "";
  return (
    accept.includes("application/ld+json") ||
    accept.includes("application/json") ||
    req.path.endsWith(".jsonld")
  );
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
