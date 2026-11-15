import { CLAUSE_END, SENTENCE_END, glen, scriptShare, stripTags } from "./text";
import type { Lang, RawSegment } from "./types";

/**
 * Cue formatter (task 4.5, SRS section 9 step 3): at most 2 lines, about 32 characters per line,
 * 1 to 7 seconds per cue. Pure functions, no I/O.
 */

export interface Token {
  text: string;
  /** seconds */
  start: number;
  end: number;
}

export interface Cue {
  /** seconds */
  start: number;
  end: number;
  /** 1 or 2 lines of plain text */
  lines: string[];
}

export interface CueOptions {
  maxLineChars: number;
  maxLines: 1 | 2;
  minDur: number;
  maxDur: number;
  /** A silence longer than this (seconds) always starts a new cue. */
  maxGap: number;
  /** Last cue may not run past this (seconds), normally the media duration. */
  endLimit: number;
}

export const DEFAULT_CUE_OPTIONS: CueOptions = {
  maxLineChars: 32,
  maxLines: 2,
  minDur: 1,
  maxDur: 7,
  maxGap: 1.2,
  endLimit: Number.POSITIVE_INFINITY,
};

const EPS = 0.0015; // timestamps are rounded to milliseconds

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** A word is never allowed to stretch over more than this, so a long pause is not painted onto the last word. */
const maxWordDur = (text: string) => 1 + 0.15 * glen(text);

/** Flattens ASR segments to timed words. Without word timings, a segment's time is shared out by word length. */
export function tokenize(segments: RawSegment[]): Token[] {
  const tokens: Token[] = [];
  for (const seg of segments) {
    const timed = (seg.words ?? [])
      .map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }))
      .filter((w) => w.text.length > 0);
    if (timed.length > 0) {
      for (const w of timed) tokens.push({ ...w, end: Math.min(Math.max(w.end, w.start), w.start + maxWordDur(w.text)) });
      continue;
    }
    const parts = seg.text.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    const total = parts.reduce((n, p) => n + glen(p), 0);
    const dur = Math.max(seg.end - seg.start, total * 0.05); // guards zero-length segments
    let t = seg.start;
    for (const p of parts) {
      const d = (dur * glen(p)) / total;
      tokens.push({ text: p, start: t, end: t + d });
      t += d;
    }
  }
  // never let words overlap, so cues cannot overlap
  let prevEnd = 0;
  for (const t of tokens) {
    if (t.start < prevEnd) t.start = prevEnd;
    if (t.end < t.start) t.end = t.start;
    prevEnd = t.end;
  }
  return tokens;
}

/**
 * Lays words out on one line, or two balanced lines, none longer than maxChars.
 * Prefers to break after punctuation. Returns null if it cannot fit.
 * A single word longer than maxChars is returned on its own line (check() flags it).
 */
export function layoutLines(words: string[], maxChars: number, maxLines: 1 | 2): string[] | null {
  if (words.length === 0) return [];
  const whole = words.join(" ");
  if (glen(whole) <= maxChars) return [whole];
  if (words.length === 1) return [whole];
  if (maxLines < 2 || glen(whole) > 2 * maxChars + 1) return null;
  let best: { score: number; i: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const la = glen(a);
    const lb = glen(b);
    if (la > maxChars || lb > maxChars) continue;
    let score = Math.abs(la - lb);
    if (CLAUSE_END.test(a) || SENTENCE_END.test(a)) score -= 14;
    if (best === null || score < best.score) best = { score, i };
  }
  if (best === null) return null;
  return [words.slice(0, best.i).join(" "), words.slice(best.i).join(" ")];
}

const cueWords = (c: Cue): string[] => c.lines.join(" ").split(" ").filter(Boolean);

function mergeCues(a: Cue, b: Cue, o: CueOptions): Cue | null {
  if (b.start - a.end > o.maxGap) return null;
  if (b.end - a.start > o.maxDur) return null;
  const lines = layoutLines([...cueWords(a), ...cueWords(b)], o.maxLineChars, o.maxLines);
  return lines ? { start: a.start, end: b.end, lines } : null;
}

/** Groups timed words into cues. */
export function buildCues(tokens: Token[], options: Partial<CueOptions> = {}): Cue[] {
  const o: CueOptions = { ...DEFAULT_CUE_OPTIONS, ...options };
  const groups: Token[][] = [];
  let cur: Token[] = [];
  const flush = () => {
    if (cur.length > 0) groups.push(cur);
    cur = [];
  };

  for (const tok of tokens) {
    const first = cur[0];
    const last = cur[cur.length - 1];
    if (first && last) {
      const tooLong = tok.end - first.start > o.maxDur;
      const pause = tok.start - last.end > o.maxGap;
      const fits = layoutLines([...cur.map((t) => t.text), tok.text], o.maxLineChars, o.maxLines) !== null;
      if (tooLong || pause || !fits) flush();
    }
    cur.push(tok);
    const start = cur[0]?.start ?? tok.start;
    const dur = tok.end - start;
    const text = cur.map((t) => t.text).join(" ");
    const sentenceEnd = SENTENCE_END.test(tok.text);
    const clauseEnd = CLAUSE_END.test(tok.text) && glen(text) >= o.maxLineChars;
    if (dur >= o.minDur && (sentenceEnd || clauseEnd)) flush();
  }
  flush();

  const cues: Cue[] = [];
  for (const g of groups) {
    const lines = layoutLines(g.map((t) => t.text), o.maxLineChars, o.maxLines) ?? [g.map((t) => t.text).join(" ")];
    const start = g[0]?.start ?? 0;
    const end = g[g.length - 1]?.end ?? start;
    cues.push({ start, end, lines });
  }
  return enforceDurations(cues, o).map((c) => ({ ...c, start: round3(c.start), end: round3(c.end) }));
}

/** Makes cues at least minDur long: merge with a close neighbour if it still fits, otherwise hold the cue on screen. */
export function enforceDurations(cues: Cue[], o: CueOptions): Cue[] {
  const out: Cue[] = [];
  for (let i = 0; i < cues.length; i++) {
    const first = cues[i];
    if (!first) continue;
    let cur: Cue = first;
    while (cur.end - cur.start < o.minDur - EPS && i + 1 < cues.length) {
      const next: Cue | undefined = cues[i + 1];
      const merged: Cue | null = next ? mergeCues(cur, next, o) : null;
      if (!merged) break;
      cur = merged;
      i++;
    }
    const prev = out[out.length - 1];
    if (cur.end - cur.start < o.minDur - EPS && prev) {
      const merged = mergeCues(prev, cur, o);
      if (merged) {
        out[out.length - 1] = merged;
        continue;
      }
    }
    out.push(cur);
  }
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (!c) continue;
    const limit = out[i + 1]?.start ?? o.endLimit;
    if (c.end - c.start < o.minDur - EPS) c.end = Math.max(c.end, Math.min(c.start + o.minDur, limit));
  }
  return out;
}

/** Segments in, cues out. */
export function formatCues(segments: RawSegment[], options: Partial<CueOptions> = {}): Cue[] {
  return buildCues(tokenize(segments), options);
}

export interface Issue {
  /** 1-based cue number, or null for a whole-file problem */
  index: number | null;
  /** error: blocks approval. warning: reported, but the reviewer may approve. */
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface CheckContext {
  lang?: Lang;
  /** media duration in seconds, when known */
  durationSec?: number;
}

/** Validates cues against the SRS limits. Used on drafts we generate and on files a human edited. */
export function checkCues(cues: Cue[], options: Partial<CueOptions> = {}, ctx: CheckContext = {}): Issue[] {
  const o: CueOptions = { ...DEFAULT_CUE_OPTIONS, ...options };
  const issues: Issue[] = [];
  const add = (index: number | null, severity: Issue["severity"], code: string, message: string) =>
    issues.push({ index, severity, code, message });

  if (cues.length === 0) {
    add(null, "error", "no-cues", "The file has no captions.");
    return issues;
  }
  let prevEnd = 0;
  cues.forEach((c, k) => {
    const n = k + 1;
    const dur = c.end - c.start;
    const text = c.lines.map(stripTags).join(" ").trim();
    if (text === "") add(n, "error", "empty-cue", `Cue ${n} has no text.`);
    if (dur <= 0) add(n, "error", "bad-timing", `Cue ${n} ends before it starts.`);
    if (c.start < prevEnd - EPS) add(n, "error", "overlap", `Cue ${n} starts before the previous cue ends.`);
    if (c.lines.length > o.maxLines) add(n, "error", "too-many-lines", `Cue ${n} has ${c.lines.length} lines (maximum ${o.maxLines}).`);
    if (ctx.durationSec !== undefined && c.start > ctx.durationSec + 1) {
      add(n, "error", "beyond-media", `Cue ${n} starts after the end of the video (${ctx.durationSec.toFixed(1)} s).`);
    }
    for (const line of c.lines) {
      if (glen(stripTags(line)) > o.maxLineChars) {
        add(n, "warning", "line-too-long", `Cue ${n} has a line longer than ${o.maxLineChars} characters.`);
        break;
      }
    }
    if (dur > 0 && dur < o.minDur - EPS) add(n, "warning", "too-short", `Cue ${n} is shorter than ${o.minDur} s.`);
    if (dur > o.maxDur + EPS) add(n, "warning", "too-long", `Cue ${n} is longer than ${o.maxDur} s.`);
    prevEnd = Math.max(prevEnd, c.end);
  });

  if (ctx.lang) {
    const share = scriptShare(cues.map((c) => c.lines.join(" ")).join(" "));
    if (ctx.lang === "am" && share.latin > 0.5) {
      add(null, "warning", "language-mismatch", "This is marked Amharic but most of the text is in Latin letters.");
    }
    if (ctx.lang === "en" && share.ethiopic > 0.5) {
      add(null, "warning", "language-mismatch", "This is marked English but most of the text is in Ethiopic letters.");
    }
  }
  return issues;
}
