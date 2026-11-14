// GET /v1/lessons, /v1/lessons/:id (contract C1), /v1/lessons/:id/captions/:lang.vtt, /v1/lessons/:id/transcript?lang=
import type { Router } from "express";
import { HttpError } from "../lib/errors";
import type { Ctx } from "../lib/context";
import { toManifest } from "../lib/manifest";
import { z } from "zod";
import type { OperationDoc } from "../lib/openapi";
import { LangQuery, LessonListSchema, LessonManifestSchema, TranscriptSchema } from "../schemas/lesson";

export function register(router: Router, ctx: Ctx) {
  router.get("/lessons", async (_req, res) => {
    const lessons = await ctx.store.listLessons();
    res.json({ lessons: lessons.map((l) => ({ id: l.id, title: l.title, durationSec: l.durationSec })) });
  });

  router.get("/lessons/:id", async (req, res) => {
    const lesson = await ctx.store.getLesson(req.params.id);
    if (!lesson) throw new HttpError(404, "Not Found", `No lesson "${req.params.id}".`);
    res.json(toManifest(lesson));
  });

  // Captions live in object storage; we hand back the file location.
  router.get("/lessons/:id/captions/:file", async (req, res) => {
    const m = /^(en|am)\.vtt$/.exec(req.params.file);
    if (!m) throw new HttpError(404, "Not Found", "Captions are available as en.vtt or am.vtt.");
    const lesson = await ctx.store.getLesson(req.params.id);
    const cap = lesson && toManifest(lesson).captions.find((c) => c.lang === m[1]);
    if (!cap) throw new HttpError(404, "Not Found", `No ${m[1]} captions for lesson "${req.params.id}".`);
    res.redirect(302, cap.url);
  });

  router.get("/lessons/:id/transcript", async (req, res) => {
    const { lang } = LangQuery.parse(req.query);
    const t = await ctx.store.getTranscript(req.params.id, lang);
    if (!t) throw new HttpError(404, "Not Found", `No ${lang} transcript for lesson "${req.params.id}".`);
    res.json(t);
  });
}

const IdParam = z.object({ id: z.string().describe("Lesson id, e.g. L-102") });

export const openapi: OperationDoc[] = [
  {
    method: "get", path: "/lessons", summary: "List lessons", tags: ["Lessons"],
    responses: { 200: { description: "Published lessons.", schema: LessonListSchema } },
  },
  {
    method: "get", path: "/lessons/{id}", summary: "Get a lesson manifest", tags: ["Lessons"],
    description: "Everything a player needs: media, English and Amharic captions, sign video, audio description, transcript and offline pack. Fields that do not exist for a lesson are null.",
    params: IdParam,
    responses: { 200: { description: "The lesson manifest (contract C1).", schema: LessonManifestSchema }, 404: { description: "Unknown lesson." } },
  },
  {
    method: "get", path: "/lessons/{id}/captions/{file}", summary: "Get a caption file", tags: ["Lessons"],
    description: "Redirects to the WebVTT file for the requested language.",
    params: IdParam.extend({ file: z.enum(["en.vtt", "am.vtt"]) }),
    responses: { 302: { description: "Redirect to the caption file.", headers: { Location: "URL of the WebVTT file" } }, 404: { description: "No captions in that language." } },
  },
  {
    method: "get", path: "/lessons/{id}/transcript", summary: "Get a lesson transcript", tags: ["Lessons"],
    params: IdParam, query: LangQuery,
    responses: { 200: { description: "Timed transcript lines.", schema: TranscriptSchema }, 404: { description: "No transcript in that language." } },
  },
];
