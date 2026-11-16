// Offline lesson packs (task 2.7)
// GET /v1/lessons/:id/pack        -> manifest JSON
// GET /v1/lessons/:id/pack.zip    -> streaming download with byte-range support
//
// Mounted under /v1 by app.ts with API-key authentication.
// Routes use relative paths (no /v1 prefix here).

import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response, Router } from "express";
import { z } from "zod";
import type { Ctx } from "../lib/context";
import type { OperationDoc } from "../lib/openapi";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Default pack storage falls back to the fixture directory for development and tests.
 * Deployments can point PACK_ROOT at a directory containing one folder per lesson.
 */
const FIXTURE_PACK_ROOT = path.resolve(here, "../../../contracts/fixtures/v1/lessons");

const IdParam = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/).describe("Lesson id, e.g. L-102"),
});

const PackFileSchema = z.looseObject({
  path: z.string().min(1).max(240).refine((value) => !value.startsWith('/') && !value.includes('..') && !value.includes('\\'), "Unsafe pack file path"),
  sizeBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  bytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i, "Pack file SHA-256 must contain 64 hexadecimal characters"),
}).refine((file) => file.sizeBytes !== undefined || file.bytes !== undefined, "Pack file size is required");

const PackManifestSchema = z.looseObject({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  sizeBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  files: z.array(PackFileSchema).min(1),
})
  .refine((manifest) => new Set(manifest.files.map((file) => file.path)).size === manifest.files.length, "Pack file paths must be unique")
  .refine((manifest) => manifest.files.reduce((sum, file) => sum + (file.sizeBytes ?? file.bytes ?? 0), 0) === manifest.sizeBytes, "Pack size must equal the sum of its files");

function problem(res: Response, status: number, title: string, detail: string) {
  return res
    .status(status)
    .type("application/problem+json")
    .json({ type: "about:blank", title, status, detail });
}

async function safeFileAt(root: string, id: string, name: string): Promise<string> {
  const dir = path.resolve(root, id);
  const file = path.resolve(dir, name);
  // Guard against path-traversal
  if (!file.startsWith(`${dir}${path.sep}`)) throw new Error("Invalid pack path");
  await fs.access(file);
  return file;
}

/**
 * Try manifest.json first (produced by build-pack.mjs), then pack.json (C8 fixture name).
 * This keeps the route working with both production packs and development fixtures.
 */
async function manifestFile(root: string, id: string): Promise<string> {
  for (const name of ["manifest.json", "pack.json"]) {
    try {
      return await safeFileAt(root, id, name);
    } catch {
      // try the next name
    }
  }
  throw new Error("Pack manifest not found");
}

/** C7 route module. Registering pack routes must never throw during app startup. */
export function register(router: Router, ctx: Ctx) {
  const root: string = ctx.packRoot ?? ctx.config.packRoot ?? FIXTURE_PACK_ROOT;

  router.get("/lessons/:id/pack", async (req: Request, res: Response) => {
    const parsed = IdParam.safeParse(req.params);
    if (!parsed.success)
      return problem(res, 400, "Invalid lesson id", "Lesson ids must be alphanumeric (A–Z, 0–9, dash, underscore, 1–80 chars).");
    try {
      const file = await manifestFile(root, parsed.data.id);
      const raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
      const manifest = PackManifestSchema.safeParse(raw);
      if (!manifest.success) return problem(res, 500, "Invalid pack manifest", "The published pack metadata is invalid.");
      return res.json(manifest.data);
    } catch {
      return problem(res, 404, "Pack not found", "No offline pack is published for this lesson.");
    }
  });

  router.get(["/lessons/:id/pack.zip", "/lessons/:id/offline-pack"], async (req: Request, res: Response) => {
    const parsed = IdParam.safeParse(req.params);
    if (!parsed.success)
      return problem(res, 400, "Invalid lesson id", "Lesson ids must be alphanumeric (A–Z, 0–9, dash, underscore, 1–80 chars).");
    try {
      const file = await safeFileAt(root, parsed.data.id, "pack.zip");
      const stat = await fs.stat(file);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${parsed.data.id}-pack.zip"`);

      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
        const rejectRange = (title: string, detail: string) => {
          res.setHeader("Content-Range", `bytes */${stat.size}`);
          return problem(res, 416, title, detail);
        };
        if (!match || (!match[1] && !match[2])) {
          return rejectRange("Invalid range", "Range header must contain a valid byte range.");
        }
        const suffixLength = match[1] ? 0 : Number(match[2]);
        const start = match[1]
          ? Number(match[1])
          : Math.max(0, stat.size - suffixLength);
        const requestedEnd = match[1] && match[2] ? Number(match[2]) : stat.size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || suffixLength < 0 || start >= stat.size || requestedEnd < start || stat.size === 0) {
          return rejectRange("Range not satisfiable", "Requested range is outside the file.");
        }
        const end = Math.min(requestedEnd, stat.size - 1);
        res
          .status(206)
          .setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`)
          .setHeader("Content-Length", String(end - start + 1));
        return createReadStream(file, { start, end }).pipe(res);
      }

      res.setHeader("Content-Length", String(stat.size));
      return createReadStream(file).pipe(res);
    } catch {
      return problem(res, 404, "Pack not found", "Offline ZIP is not available for this lesson.");
    }
  });
}

export const openapi: OperationDoc[] = [
  {
    method: "get",
    path: "/lessons/{id}/pack",
    summary: "Get an offline lesson pack manifest",
    tags: ["Offline"],
    params: IdParam,
    responses: {
      200: {
        description: "Pack manifest with the list of included files and their SHA-256 checksums.",
        schema: PackManifestSchema,
      },
      404: { description: "No pack is published for this lesson." },
    },
  },
  {
    method: "get",
    path: "/lessons/{id}/pack.zip",
    summary: "Download an offline lesson pack",
    tags: ["Offline"],
    params: IdParam,
    responses: {
      200: {
        description: "The complete offline lesson ZIP.",
        contentType: "application/zip",
        headers: {
          "Content-Disposition": "Attachment filename",
          "Accept-Ranges": "Indicates byte-range support",
        },
      },
      206: {
        description: "Partial ZIP content (byte-range response).",
        contentType: "application/zip",
        headers: { "Content-Range": "Returned byte range" },
      },
      404: { description: "No pack ZIP is available for this lesson." },
    },
  },
];
