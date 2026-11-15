import type { Cue, Issue } from "./cues";
import type { Lang } from "./types";
import { stripTags } from "./text";

/** "HH:MM:SS.mmm" */
export function formatTimestamp(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}.${p(ms % 1000, 3)}`;
}

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescapeText = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&lrm;|&rlm;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

export interface WriteOptions {
  lang: Lang;
  /** Adds a NOTE telling the reader this file is an unreviewed draft. */
  draft?: boolean;
}

/** Writes captions as WebVTT. Cue numbers make it easy for a reviewer to say "cue 12". */
export function writeVtt(cues: Cue[], opts: WriteOptions): string {
  const head = ["WEBVTT", "Kind: captions", `Language: ${opts.lang}`, ""];
  if (opts.draft) {
    head.push("NOTE", "DRAFT: not reviewed. Correct the text, then run: pnpm pipeline review approve", "");
  }
  const body = cues.map((c, i) =>
    [String(i + 1), `${formatTimestamp(c.start)} --> ${formatTimestamp(c.end)}`, ...c.lines.map(escapeText)].join("\n"),
  );
  return head.join("\n") + "\n" + body.join("\n\n") + "\n";
}

const TIME = String.raw`(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})`;
const TIMING = new RegExp(`^\\s*${TIME}\\s+-->\\s+${TIME}`);

const toSeconds = (h: string | undefined, m: string | undefined, s: string | undefined, ms: string | undefined) =>
  Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0) + Number(ms ?? 0) / 1000;

export interface ParsedVtt {
  cues: Cue[];
  issues: Issue[];
}

/**
 * Tolerant WebVTT reader (also reads SRT through parseSrt). Problems become issues, never exceptions,
 * so a reviewer gets the whole list at once.
 */
export function parseVtt(input: string): ParsedVtt {
  const issues: Issue[] = [];
  const text = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = text.split(/\n{2,}/).map((b) => b.replace(/^\n+|\n+$/g, "")).filter((b) => b.length > 0);
  const first = blocks[0];
  if (!first || !/^WEBVTT(?:[ \t\n]|$)/.test(first)) {
    issues.push({ index: null, severity: "error", code: "not-vtt", message: "The file does not start with WEBVTT." });
    return { cues: [], issues };
  }
  const cues: Cue[] = [];
  let strippedMarkup = false;
  for (const block of blocks.slice(1)) {
    const lines = block.split("\n");
    const head = lines[0] ?? "";
    if (/^(NOTE|STYLE|REGION)(?:[ \t]|$)/.test(head)) continue;
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) {
      issues.push({ index: null, severity: "error", code: "stray-block", message: `Text without a timing line: "${head.slice(0, 40)}".` });
      continue;
    }
    const m = TIMING.exec(lines[at] ?? "");
    if (!m) {
      issues.push({ index: cues.length + 1, severity: "error", code: "bad-timing-line", message: `Cannot read the timing line: "${(lines[at] ?? "").slice(0, 60)}".` });
      continue;
    }
    const payload = lines.slice(at + 1).map((l) => l.replace(/\s+$/, ""));
    if (payload.some((l) => /<[^>]*>/.test(l))) strippedMarkup = true;
    cues.push({
      start: toSeconds(m[1], m[2], m[3], m[4]),
      end: toSeconds(m[5], m[6], m[7], m[8]),
      lines: payload.map((l) => unescapeText(stripTags(l))).filter((l) => l.trim() !== ""),
    });
  }
  if (strippedMarkup) {
    issues.push({ index: null, severity: "warning", code: "markup-removed", message: "Formatting tags were removed; captions are plain text." });
  }
  return { cues, issues };
}

export function parseSrt(input: string): ParsedVtt {
  return parseVtt("WEBVTT\n\n" + input.replace(/^\uFEFF/, ""));
}
