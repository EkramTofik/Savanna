import fs from "node:fs";
import path from "node:path";
import { run } from "../ingest/exec";
import type { Cue, Issue } from "./cues";
import { parseVtt, parseSrt } from "./vtt";
import type { Lang, RawSegment, RawTranscript, RawWord } from "./types";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Reads engine output into segments. Accepts the openai-whisper JSON layout
 * ({ segments: [{ start, end, text, words: [{ word, start, end }] }] }) and our own layout
 * (words use "text" instead of "word"), so any ASR wrapper only has to write one of the two.
 */
export function parseSegments(json: unknown): RawSegment[] {
  const segs = isObj(json) ? json["segments"] : undefined;
  if (!Array.isArray(segs)) throw new Error('The ASR output has no "segments" list.');
  const out: RawSegment[] = [];
  for (const s of segs) {
    if (!isObj(s)) continue;
    const start = num(s["start"]);
    const end = num(s["end"]);
    const text = typeof s["text"] === "string" ? s["text"].trim() : "";
    if (start === null || end === null || text === "") continue;
    const words: RawWord[] = [];
    if (Array.isArray(s["words"])) {
      for (const w of s["words"]) {
        if (!isObj(w)) continue;
        const t = typeof w["text"] === "string" ? w["text"] : typeof w["word"] === "string" ? w["word"] : "";
        const ws = num(w["start"]);
        const we = num(w["end"]);
        if (t.trim() !== "" && ws !== null && we !== null) words.push({ text: t.trim(), start: ws, end: we });
      }
    }
    out.push(words.length > 0 ? { start, end, text, words } : { start, end, text });
  }
  if (out.length === 0) throw new Error("The ASR output contains no usable segments.");
  return out;
}

export function parseRawTranscript(json: unknown, lang: Lang, engine: string, machineGenerated = true): RawTranscript {
  return { lang, engine, machineGenerated, segments: parseSegments(json) };
}

export interface WhisperOptions {
  audio: string;
  lang: Lang;
  /** tiny | base | small | medium | large-v3 ... (Whisper model name) */
  model?: string;
  outDir: string;
  /** Defaults to env WHISPER_BIN, then "whisper" (the openai-whisper command line tool). */
  bin?: string;
  device?: string;
}

/** English (and candidate Amharic) transcription with open-source Whisper. Needs `pip install openai-whisper`. */
export async function transcribeWithWhisper(o: WhisperOptions): Promise<RawTranscript> {
  const bin = o.bin ?? process.env["WHISPER_BIN"] ?? "whisper";
  const model = o.model ?? "small";
  fs.mkdirSync(o.outDir, { recursive: true });
  const args = [
    o.audio,
    "--model", model,
    "--language", o.lang,
    "--output_format", "json",
    "--output_dir", o.outDir,
    "--word_timestamps", "True",
  ];
  if (o.device) args.push("--device", o.device);
  if (o.device === "cpu") args.push("--fp16", "False");
  await run(bin, args);
  const file = path.join(o.outDir, path.basename(o.audio, path.extname(o.audio)) + ".json");
  const json: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  return parseRawTranscript(json, o.lang, `whisper:${model}`);
}

/** Splits a command line into arguments, honouring "double" and 'single' quotes. No shell is involved. */
export function splitCommand(template: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  let has = false;
  for (const ch of template) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (/\s/.test(ch)) {
      if (has || cur) out.push(cur);
      cur = "";
      has = false;
    } else {
      cur += ch;
    }
  }
  if (quote) throw new Error("The command has an unclosed quote.");
  if (has || cur) out.push(cur);
  return out;
}

export interface CommandOptions {
  /** e.g. 'python3 tools/mms_asr.py --audio {audio} --lang {lang} --out {out}'. Without {out}, JSON is read from stdout. */
  template: string;
  audio: string;
  lang: Lang;
  /** where {out} points */
  outFile: string;
  /** label stored with the transcript, e.g. "mms" */
  name: string;
}

/**
 * Runs any external ASR (Meta MMS, SeamlessM4T, a Whisper wrapper ...) that writes JSON segments.
 * This is how Amharic engines are plugged in and compared without changing the pipeline.
 */
export async function transcribeWithCommand(o: CommandOptions): Promise<RawTranscript> {
  const parts = splitCommand(o.template);
  const [bin, ...rest] = parts;
  if (!bin) throw new Error("The ASR command is empty.");
  const usesOut = parts.some((p) => p.includes("{out}"));
  const args = rest.map((p) => p.replaceAll("{audio}", o.audio).replaceAll("{lang}", o.lang).replaceAll("{out}", o.outFile));
  fs.mkdirSync(path.dirname(o.outFile), { recursive: true });
  const { stdout } = await run(bin, args);
  const text = usesOut ? fs.readFileSync(o.outFile, "utf8") : stdout;
  return parseRawTranscript(JSON.parse(text), o.lang, `command:${o.name}`);
}

export type ImportedCaptions =
  | { kind: "cues"; engine: string; cues: Cue[]; issues: Issue[] }
  | { kind: "raw"; transcript: RawTranscript };

/**
 * Imports a human-made or externally made caption file.
 * .vtt and .srt are kept exactly as authored (cue times and line breaks are not changed);
 * .json segment files are treated like ASR output and go through the cue formatter.
 */
export function importCaptionFile(file: string, lang: Lang): ImportedCaptions {
  const raw = fs.readFileSync(file, "utf8");
  const ext = path.extname(file).toLowerCase();
  const engine = `imported:${path.basename(file)}`;
  if (ext === ".json") {
    return { kind: "raw", transcript: parseRawTranscript(JSON.parse(raw), lang, engine, false) };
  }
  const parsed = ext === ".srt" ? parseSrt(raw) : parseVtt(raw);
  return { kind: "cues", engine, cues: parsed.cues, issues: parsed.issues };
}
