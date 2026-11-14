import fs from "node:fs";
import path from "node:path";
import { graphemes } from "./text";
import { parseSegments } from "./whisper";
import { parseSrt, parseVtt } from "./vtt";
import type { Lang } from "./types";

/**
 * Amharic ASR evaluation (task 4.5, SRS section 4.1 and Appendix B).
 * Scores candidate engines (Whisper, Meta MMS, SeamlessM4T ...) against a human-corrected reference,
 * so the team picks an engine from numbers instead of guessing. The result is still only a draft
 * generator: every Amharic caption is corrected by a person before it ships.
 */

/** Amharic has several letters that sound identical (ሀ ሐ ኀ, ሰ ሠ, አ ዐ, ጸ ፀ). Folding them stops spelling choice counting as a recognition error. */
const HOMOPHONE_BASES: Array<[from: number, to: number]> = [
  [0x1210, 0x1200], // ሐ -> ሀ
  [0x1280, 0x1200], // ኀ -> ሀ
  [0x1220, 0x1230], // ሠ -> ሰ
  [0x12d0, 0x12a0], // ዐ -> አ
  [0x1340, 0x1338], // ፀ -> ጸ
];

export function foldHomophones(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    let mapped = cp;
    for (const [from, to] of HOMOPHONE_BASES) {
      if (cp >= from && cp < from + 8) {
        mapped = to + (cp - from);
        break;
      }
    }
    out += String.fromCodePoint(mapped);
  }
  return out;
}

export interface NormaliseOptions {
  lang: Lang;
  /** Amharic only. Default true. */
  fold?: boolean;
}

/** Lower-cases (English), drops punctuation, treats the Ethiopic word separator as a space, collapses spaces. */
export function normaliseForEval(text: string, o: NormaliseOptions): string {
  let t = text.normalize("NFC").replace(/\u1361/g, " ").replace(/['’]/g, "");
  if (o.lang === "en") t = t.toLowerCase();
  else if (o.fold !== false) t = foldHomophones(t);
  return t.replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
}

export interface ErrorCount {
  substitutions: number;
  deletions: number;
  insertions: number;
  refLength: number;
  /** (S + D + I) / refLength */
  rate: number;
}

/** Edit distance with a count of each kind of error. */
export function editCounts<T>(ref: T[], hyp: T[]): ErrorCount {
  const n = ref.length;
  const m = hyp.length;
  type Cell = { cost: number; s: number; d: number; i: number };
  let prev: Cell[] = Array.from({ length: m + 1 }, (_, j) => ({ cost: j, s: 0, d: 0, i: j }));
  for (let a = 1; a <= n; a++) {
    const row: Cell[] = [{ cost: a, s: 0, d: a, i: 0 }];
    for (let b = 1; b <= m; b++) {
      const diag = prev[b - 1] as Cell;
      const up = prev[b] as Cell;
      const left = row[b - 1] as Cell;
      const same = ref[a - 1] === hyp[b - 1];
      const options: Cell[] = [
        { cost: diag.cost + (same ? 0 : 1), s: diag.s + (same ? 0 : 1), d: diag.d, i: diag.i },
        { cost: up.cost + 1, s: up.s, d: up.d + 1, i: up.i },
        { cost: left.cost + 1, s: left.s, d: left.d, i: left.i + 1 },
      ];
      row.push(options.reduce((best, c) => (c.cost < best.cost ? c : best)));
    }
    prev = row;
  }
  const end = prev[m] as Cell;
  return { substitutions: end.s, deletions: end.d, insertions: end.i, refLength: n, rate: n === 0 ? (m === 0 ? 0 : 1) : end.cost / n };
}

const words = (t: string) => (t === "" ? [] : t.split(" "));
const chars = (t: string) => graphemes(t.replace(/ /g, ""));

export function wer(reference: string, hypothesis: string, o: NormaliseOptions): ErrorCount {
  return editCounts(words(normaliseForEval(reference, o)), words(normaliseForEval(hypothesis, o)));
}

/** Character error rate. Each Ethiopic character is a whole syllable, so this is close to a syllable error rate. */
export function cer(reference: string, hypothesis: string, o: NormaliseOptions): ErrorCount {
  return editCounts(chars(normaliseForEval(reference, o)), chars(normaliseForEval(hypothesis, o)));
}

/** Reads plain text from .txt, .vtt, .srt or a segments .json (so the approved am.vtt can be the reference). */
export function loadText(file: string): string {
  const raw = fs.readFileSync(file, "utf8");
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") return parseSegments(JSON.parse(raw)).map((s) => s.text).join(" ");
  if (ext === ".vtt" || ext === ".srt") {
    const parsed = ext === ".srt" ? parseSrt(raw) : parseVtt(raw);
    return parsed.cues.map((c) => c.lines.join(" ")).join(" ");
  }
  return raw;
}

export interface EvalRow {
  name: string;
  wer: number;
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  refWords: number;
}

export function evaluateCandidates(reference: string, candidates: Array<{ name: string; text: string }>, o: NormaliseOptions): EvalRow[] {
  return candidates
    .map((c) => {
      const w = wer(reference, c.text, o);
      const ch = cer(reference, c.text, o);
      return { name: c.name, wer: w.rate, cer: ch.rate, substitutions: w.substitutions, deletions: w.deletions, insertions: w.insertions, refWords: w.refLength };
    })
    .sort((a, b) => a.wer - b.wer);
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function renderReport(rows: EvalRow[], meta: { lang: Lang; reference: string; fold: boolean }): string {
  const lines = [
    `# ${meta.lang === "am" ? "Amharic" : "English"} ASR evaluation`,
    "",
    `Reference: \`${meta.reference}\` (${rows[0]?.refWords ?? 0} words). ` +
      (meta.lang === "am" ? `Homophone letters folded: ${meta.fold ? "yes" : "no"}. ` : "") +
      "Lower is better.",
    "",
    "| Engine | WER | CER | Substituted | Deleted | Inserted |",
    "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.name} | ${pct(r.wer)} | ${pct(r.cer)} | ${r.substitutions} | ${r.deletions} | ${r.insertions} |`),
    "",
    "These numbers pick the best draft generator. They do not make captions publishable: " +
      "every caption is corrected and approved by a person first (SRS section 9, step 3).",
    "",
  ];
  return lines.join("\n");
}
