import { z } from "zod";

const url = z.string().url();
// Same-origin fixture media paths let the host page and its service worker share the cached files.
const assetUrl = z.union([
  url,
  z
    .string()
    .startsWith("/media/")
    .refine((value) => !value.includes("..")),
]);
export const Lang = z.enum(["en", "am"]);
export type Lang = z.infer<typeof Lang>;

/** Contract C1. The API output AND contracts/fixtures/v1/lessons/*.json must both satisfy this. */
export const LessonManifestSchema = z.object({
  id: z.string().min(1),
  title: z.object({ en: z.string(), am: z.string() }),
  summary: z.object({ en: z.string(), am: z.string() }).optional(),
  durationSec: z.number().int().nonnegative(),
  media: z.object({ video: assetUrl, audio: assetUrl }),
  captions: z.array(z.object({ lang: Lang, url: assetUrl })),
  sign: z
    .object({
      url: assetUrl,
      offsetMs: z.number().int().nonnegative(),
      languageName: z.string().min(1).optional(),
    })
    .nullable(),
  audioDescription: z
    .object({
      audioUrl: assetUrl,
      vttUrl: assetUrl,
      extended: z.boolean(),
      offsetMs: z.number().int().nonnegative().optional(),
    })
    .nullable(),
  transcript: z.object({ url: z.string().startsWith("/v1/") }),
  pack: z
    .object({
      manifestUrl: z.string().startsWith("/v1/"),
      sizeBytes: z.number().int().nonnegative(),
    })
    .nullable(),
});
export type LessonManifest = z.infer<typeof LessonManifestSchema>;

export const TranscriptSchema = z.object({
  id: z.string(),
  lang: Lang,
  lines: z.array(
    z.object({ start: z.number().nonnegative(), end: z.number().nonnegative(), text: z.string() }),
  ),
});
export type Transcript = z.infer<typeof TranscriptSchema>;

export const LangQuery = z.object({ lang: Lang.default("en") });

export const LessonListSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      title: z.object({ en: z.string(), am: z.string() }),
      durationSec: z.number().int(),
    }),
  ),
});
