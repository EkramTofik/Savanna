import fs from "node:fs";
import path from "node:path";
import { checkCues, formatCues, type Cue, type CueOptions, type Issue } from "./cues";
import { draftPath, readDurationSec, registerDraft } from "./review";
import type { Lang, RawTranscript } from "./types";
import { writeVtt } from "./vtt";

export interface DraftResult {
  file: string;
  cues: Cue[];
  issues: Issue[];
}

function writeDraft(root: string, lessonId: string, lang: Lang, cues: Cue[], source: string, machineGenerated: boolean, cue?: Partial<CueOptions>): DraftResult {
  const durationSec = readDurationSec(root);
  const issues = checkCues(cues, cue, { lang, ...(durationSec !== undefined ? { durationSec } : {}) });
  const file = draftPath(root, lang);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, writeVtt(cues, { lang, draft: true }));
  registerDraft(root, lessonId, lang, source, machineGenerated);
  return { file, cues, issues };
}

/** ASR output in: raw transcript saved, cues formatted, reviewable draft written, review state reset to "draft". */
export function createDraftFromRaw(root: string, lessonId: string, raw: RawTranscript, cue: Partial<CueOptions> = {}): DraftResult {
  const rawFile = path.join(root, "transcribe", `raw.${raw.lang}.json`);
  fs.mkdirSync(path.dirname(rawFile), { recursive: true });
  fs.writeFileSync(rawFile, JSON.stringify(raw, null, 2) + "\n");
  const durationSec = readDurationSec(root);
  const cues = formatCues(raw.segments, { ...(durationSec !== undefined ? { endLimit: durationSec } : {}), ...cue });
  return writeDraft(root, lessonId, raw.lang, cues, raw.engine, raw.machineGenerated, cue);
}

/** Cues that are already authored (an imported .vtt or .srt): kept exactly as they are. */
export function createDraftFromCues(root: string, lessonId: string, lang: Lang, cues: Cue[], source: string, machineGenerated = false): DraftResult {
  return writeDraft(root, lessonId, lang, cues, source, machineGenerated);
}

/** Saves an ASR run as a candidate for the Amharic comparison. Does not touch drafts or review state. */
export function saveCandidate(root: string, raw: RawTranscript, name: string): string {
  const file = path.join(root, "transcribe", "candidates", `${raw.lang}.${name}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
  return file;
}
