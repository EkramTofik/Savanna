/** Languages the Access API serves (matches apps/api/src/schemas/lesson.ts). */
export type Lang = "en" | "am";
export const LANGS: readonly Lang[] = ["en", "am"];

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "am";
}

export interface RawWord {
  text: string;
  /** seconds */
  start: number;
  end: number;
}

export interface RawSegment {
  /** seconds */
  start: number;
  end: number;
  text: string;
  /** Word timings when the engine provides them. Optional: many Amharic engines do not. */
  words?: RawWord[];
}

/** What every ASR engine (or an imported file) is turned into before cue formatting. */
export interface RawTranscript {
  lang: Lang;
  /** e.g. "whisper:small", "command:mms", "imported:am.vtt" */
  engine: string;
  /** true for ASR output; such captions are drafts that a human must correct (SRS section 9, step 3). */
  machineGenerated: boolean;
  segments: RawSegment[];
}
