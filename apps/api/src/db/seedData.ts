import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromManifest } from "../lib/manifest";
import { LessonManifestSchema, TranscriptSchema, type Transcript } from "../schemas/lesson";
import type { LessonRecord } from "./store";

// apps/api/src/db -> repo root is four levels up
export const FIXTURES_DIR = fileURLToPath(new URL("../../../../contracts/fixtures/v1/lessons", import.meta.url));

/** Reads contracts/fixtures/v1/lessons/*.json (and <id>/transcript.json). Throws if a fixture breaks contract C1. */
export function loadSeedData(dir = FIXTURES_DIR): { lessons: LessonRecord[]; transcripts: Transcript[] } {
  const lessons: LessonRecord[] = [];
  const transcripts: Transcript[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const manifest = LessonManifestSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
    lessons.push(fromManifest(manifest));
    const tFile = path.join(dir, manifest.id, "transcript.json");
    if (fs.existsSync(tFile)) transcripts.push(TranscriptSchema.parse(JSON.parse(fs.readFileSync(tFile, "utf8"))));
  }
  return { lessons, transcripts };
}
