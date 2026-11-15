import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { checkCues, type CueOptions, type Issue } from "./cues";
import { LANGS, type Lang } from "./types";
import { parseVtt, writeVtt } from "./vtt";

/**
 * Review gate (task 4.5, SRS section 9 step 3: "reviewed=true gates publishing").
 *
 * Everything for one lesson lives under <out>/<lessonId>/:
 *   captions/<lang>.draft.vtt   generated or imported; a human edits THIS file
 *   captions/<lang>.vtt         written only by `approve`; this is what may be published
 *   review.json                 who approved what, and the file hashes that prove nothing changed since
 */

export interface TrackState {
  lang: Lang;
  status: "draft" | "reviewed";
  /** where the draft came from, e.g. "whisper:small" or "imported:am.vtt" */
  source: string;
  machineGenerated: boolean;
  draftFile: string;
  draftSha256: string;
  reviewedBy?: string;
  reviewedAt?: string;
  /** hash of the draft file at the moment it was approved */
  reviewedDraftSha256?: string;
  publishedFile?: string;
  publishedSha256?: string;
}

export interface ReviewFile {
  version: 1;
  lessonId: string;
  tracks: Partial<Record<Lang, TrackState>>;
}

export class ReviewError extends Error {
  constructor(message: string, public issues: Issue[] = []) {
    super(message);
    this.name = "ReviewError";
  }
}

export class GateError extends Error {
  constructor(public problems: string[]) {
    super(`Not ready to publish:\n- ${problems.join("\n- ")}`);
    this.name = "GateError";
  }
}

export const lessonRoot = (outDir: string, lessonId: string) => path.join(outDir, lessonId);
export const draftPath = (root: string, lang: Lang) => path.join(root, "captions", `${lang}.draft.vtt`);
export const publishedPath = (root: string, lang: Lang) => path.join(root, "captions", `${lang}.vtt`);
const reviewPath = (root: string) => path.join(root, "review.json");

export const sha256 = (data: string | Buffer) => crypto.createHash("sha256").update(data).digest("hex");

export function readReview(root: string, lessonId: string): ReviewFile {
  const file = reviewPath(root);
  if (!fs.existsSync(file)) return { version: 1, lessonId, tracks: {} };
  return JSON.parse(fs.readFileSync(file, "utf8")) as ReviewFile;
}

function writeReview(root: string, review: ReviewFile): void {
  fs.mkdirSync(root, { recursive: true });
  const tmp = reviewPath(root) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(review, null, 2) + "\n");
  fs.renameSync(tmp, reviewPath(root));
}

/** Media duration saved by ingest, if ingest has run. */
export function readDurationSec(root: string): number | undefined {
  const file = path.join(root, "ingest", "ingest.json");
  if (!fs.existsSync(file)) return undefined;
  const d = (JSON.parse(fs.readFileSync(file, "utf8")) as { video?: { durationSec?: unknown } }).video?.durationSec;
  return typeof d === "number" ? d : undefined;
}

/** Records a new draft. Any earlier approval of this language is withdrawn and its published file removed. */
export function registerDraft(root: string, lessonId: string, lang: Lang, source: string, machineGenerated: boolean): TrackState {
  const file = draftPath(root, lang);
  const review = readReview(root, lessonId);
  const state: TrackState = {
    lang,
    status: "draft",
    source,
    machineGenerated,
    draftFile: path.relative(root, file),
    draftSha256: sha256(fs.readFileSync(file)),
  };
  review.tracks[lang] = state;
  fs.rmSync(publishedPath(root, lang), { force: true });
  writeReview(root, review);
  return state;
}

export interface ApproveOptions {
  root: string;
  lessonId: string;
  lang: Lang;
  /** the reviewer's name; required */
  by: string;
  /** treat warnings (cue too short, line too long ...) as blocking too */
  strict?: boolean;
  cue?: Partial<CueOptions>;
}

/** Marks a track reviewed. Reads the (human-edited) draft, validates it, and writes the publishable file. */
export function approveTrack(o: ApproveOptions): { issues: Issue[]; publishedFile: string } {
  if (o.by.trim() === "") throw new ReviewError("Say who reviewed it (--by \"Name\").");
  const review = readReview(o.root, o.lessonId);
  const state = review.tracks[o.lang];
  const draft = draftPath(o.root, o.lang);
  if (!state || !fs.existsSync(draft)) {
    throw new ReviewError(`There is no ${o.lang} draft for ${o.lessonId}. Run transcribe (or import a file) first.`);
  }
  const draftBytes = fs.readFileSync(draft);
  const parsed = parseVtt(draftBytes.toString("utf8"));
  const durationSec = readDurationSec(o.root);
  const issues = [
    ...parsed.issues,
    ...checkCues(parsed.cues, o.cue, { lang: o.lang, ...(durationSec !== undefined ? { durationSec } : {}) }),
  ];
  const blocking = issues.filter((i) => i.severity === "error" || (o.strict && i.severity === "warning"));
  if (blocking.length > 0) throw new ReviewError(`${o.lang}: ${blocking.length} problem(s) to fix before approval.`, issues);

  const published = publishedPath(o.root, o.lang);
  const vtt = writeVtt(parsed.cues, { lang: o.lang });
  fs.mkdirSync(path.dirname(published), { recursive: true });
  fs.writeFileSync(published, vtt);

  state.status = "reviewed";
  state.reviewedBy = o.by.trim();
  state.reviewedAt = new Date().toISOString();
  state.reviewedDraftSha256 = sha256(draftBytes);
  state.draftSha256 = state.reviewedDraftSha256;
  state.publishedFile = path.relative(o.root, published);
  state.publishedSha256 = sha256(vtt);
  writeReview(o.root, review);
  return { issues, publishedFile: published };
}

export interface GateResult {
  ok: boolean;
  problems: string[];
}

/**
 * The publish gate. Passes only if every required language is reviewed, the published file exists,
 * and neither it nor the draft has been changed since the approval.
 */
export function checkGate(root: string, lessonId: string, require: readonly Lang[] = LANGS): GateResult {
  const review = readReview(root, lessonId);
  const problems: string[] = [];
  for (const lang of require) {
    const t = review.tracks[lang];
    if (!t) {
      problems.push(`${lang}: no captions yet.`);
      continue;
    }
    if (t.status !== "reviewed") {
      problems.push(`${lang}: still a draft (${t.machineGenerated ? "machine-generated, " : ""}not reviewed).`);
      continue;
    }
    const pub = publishedPath(root, lang);
    if (!fs.existsSync(pub)) {
      problems.push(`${lang}: the approved file captions/${lang}.vtt is missing.`);
    } else if (sha256(fs.readFileSync(pub)) !== t.publishedSha256) {
      problems.push(`${lang}: captions/${lang}.vtt was changed after approval. Edit the draft and approve again.`);
    }
    const draft = draftPath(root, lang);
    if (!fs.existsSync(draft) || sha256(fs.readFileSync(draft)) !== t.reviewedDraftSha256) {
      problems.push(`${lang}: the draft was edited after approval. Approve again.`);
    }
  }
  return { ok: problems.length === 0, problems };
}

/** For the publish step: throws unless the gate passes. */
export function assertPublishable(root: string, lessonId: string, require: readonly Lang[] = LANGS): void {
  const g = checkGate(root, lessonId, require);
  if (!g.ok) throw new GateError(g.problems);
}
