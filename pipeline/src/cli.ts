import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { ingestLesson } from "./ingest/ingest";
import {
  approveTrack,
  checkGate,
  createDraftFromCues,
  createDraftFromRaw,
  evaluateCandidates,
  importCaptionFile,
  isLang,
  lessonRoot,
  loadText,
  normaliseForEval,
  readReview,
  renderReport,
  ReviewError,
  saveCandidate,
  transcribeWithCommand,
  transcribeWithWhisper,
  LANGS,
  type DraftResult,
  type Issue,
  type Lang,
  type RawTranscript,
} from "./transcribe";

/** Relative paths are resolved from where the user typed the command (pnpm sets INIT_CWD). */
const base = () => process.env["INIT_CWD"] ?? process.cwd();
const abs = (p: string) => path.resolve(base(), p);

const USAGE = `Savanna lesson pipeline (front half: ingest, transcribe, caption cues, review gate)

  pipeline run --video lesson.mp4 --lesson L-102 [--sign sign.mp4] [--sign-offset-ms 0]
               [--model small] [--device cpu] [--en-cmd "..."] [--am-cmd "..."] [--am-import file.vtt]
  pipeline ingest      --video lesson.mp4 --lesson L-102 [--sign sign.mp4] [--sign-offset-ms 0]
  pipeline transcribe  --lesson L-102 --lang en|am [--model small] [--cmd "..."] [--import file]
                       [--candidate name]   (save as an ASR candidate only; drafts are not touched)
  pipeline review status  --lesson L-102
  pipeline review approve --lesson L-102 --lang en|am --by "Reviewer name" [--strict]
  pipeline review gate    --lesson L-102 [--require en,am]
  pipeline eval-asr --lang am --ref reviewed.vtt --hyp mms=mms.json --hyp whisper=whisper.json [--out report.md]

Common option: --out <folder> (default pipeline-out). ASR commands may use {audio} {lang} {out}.`;

function fail(message: string): never {
  throw new Error(message);
}

function need(value: string | undefined, flag: string): string {
  if (!value) fail(`Missing ${flag}.\n\n${USAGE}`);
  return value;
}

function needLang(value: string | undefined): Lang {
  if (!isLang(value)) fail("Use --lang en or --lang am.");
  return value;
}

function printIssues(issues: Issue[]): void {
  for (const i of issues) console.log(`  ${i.severity === "error" ? "ERROR  " : "warning"} ${i.message}`);
}

function describeDraft(lang: Lang, d: DraftResult): void {
  const errors = d.issues.filter((i) => i.severity === "error").length;
  const warnings = d.issues.length - errors;
  console.log(`${lang}: ${d.cues.length} cues -> ${path.relative(base(), d.file)} (${errors} errors, ${warnings} warnings)`);
  printIssues(d.issues);
}

interface CommonValues {
  out?: string | undefined;
  lesson?: string | undefined;
}

function rootOf(v: CommonValues): { root: string; lessonId: string } {
  const lessonId = need(v.lesson, "--lesson");
  return { root: lessonRoot(abs(v.out ?? "pipeline-out"), lessonId), lessonId };
}

async function transcribeLang(opts: {
  root: string;
  lessonId: string;
  lang: Lang;
  model?: string | undefined;
  device?: string | undefined;
  cmd?: string | undefined;
  importFile?: string | undefined;
  candidate?: string | undefined;
}): Promise<void> {
  const { root, lessonId, lang } = opts;
  if (opts.importFile) {
    if (opts.candidate) fail("--import cannot be combined with --candidate.");
    const imported = importCaptionFile(abs(opts.importFile), lang);
    if (imported.kind === "cues") {
      printIssues(imported.issues);
      describeDraft(lang, createDraftFromCues(root, lessonId, lang, imported.cues, imported.engine));
    } else {
      describeDraft(lang, createDraftFromRaw(root, lessonId, imported.transcript));
    }
    return;
  }
  const audio = path.join(root, "ingest", "audio.wav");
  if (!fs.existsSync(audio)) fail(`No audio found. Run "ingest" first (expected ${path.relative(base(), audio)}).`);

  let raw: RawTranscript;
  if (opts.cmd) {
    const name = opts.candidate ?? "custom";
    raw = await transcribeWithCommand({
      template: opts.cmd,
      audio,
      lang,
      outFile: path.join(root, "transcribe", `${lang}.${name}.cmd.json`),
      name,
    });
  } else if (lang === "en" || opts.candidate) {
    raw = await transcribeWithWhisper({
      audio,
      lang,
      outDir: path.join(root, "transcribe", "whisper"),
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.device ? { device: opts.device } : {}),
    });
  } else {
    fail(
      "No Amharic engine is configured. Amharic ASR is weak and must be evaluated first: give --cmd with a chosen engine, " +
        "or --import a caption file, or compare engines with --candidate and eval-asr.",
    );
  }
  if (opts.candidate) {
    console.log(`${lang}: candidate "${opts.candidate}" saved to ${path.relative(base(), saveCandidate(root, raw, opts.candidate))}`);
    return;
  }
  describeDraft(lang, createDraftFromRaw(root, lessonId, raw));
}

async function cmdRun(args: string[]): Promise<void> {
  const { values: v } = parseArgs({
    args,
    options: {
      video: { type: "string" }, sign: { type: "string" }, "sign-offset-ms": { type: "string" }, lesson: { type: "string" },
      out: { type: "string" }, model: { type: "string" }, device: { type: "string" },
      "en-cmd": { type: "string" }, "am-cmd": { type: "string" }, "am-import": { type: "string" },
    },
  });
  const { root, lessonId } = rootOf(v);
  const result = await ingestLesson({
    lessonId,
    root,
    video: abs(need(v.video, "--video")),
    ...(v.sign ? { sign: abs(v.sign) } : {}),
    ...(v["sign-offset-ms"] ? { signOffsetMs: Number(v["sign-offset-ms"]) } : {}),
  });
  console.log(`ingest: ${result.video.durationSec.toFixed(1)} s video, audio ready${result.sign ? ", sign video ready" : ", no sign video"}`);
  for (const w of result.warnings) console.log(`  warning ${w}`);

  await transcribeLang({ root, lessonId, lang: "en", model: v.model, device: v.device, cmd: v["en-cmd"] });
  if (v["am-cmd"] || v["am-import"]) {
    await transcribeLang({ root, lessonId, lang: "am", cmd: v["am-cmd"], importFile: v["am-import"] });
  } else {
    console.log("am: skipped (no Amharic engine or file given). Use --am-cmd, --am-import, or run transcribe --lang am later.");
  }
  console.log(`\nDrafts are NOT publishable. Correct captions/<lang>.draft.vtt, then:\n  pipeline review approve --lesson ${lessonId} --lang en --by "Your name"`);
}

async function cmdIngest(args: string[]): Promise<void> {
  const { values: v } = parseArgs({
    args,
    options: { video: { type: "string" }, sign: { type: "string" }, "sign-offset-ms": { type: "string" }, lesson: { type: "string" }, out: { type: "string" } },
  });
  const { root, lessonId } = rootOf(v);
  const r = await ingestLesson({
    lessonId,
    root,
    video: abs(need(v.video, "--video")),
    ...(v.sign ? { sign: abs(v.sign) } : {}),
    ...(v["sign-offset-ms"] ? { signOffsetMs: Number(v["sign-offset-ms"]) } : {}),
  });
  console.log(JSON.stringify(r, null, 2));
}

async function cmdTranscribe(args: string[]): Promise<void> {
  const { values: v } = parseArgs({
    args,
    options: {
      lesson: { type: "string" }, lang: { type: "string" }, out: { type: "string" }, model: { type: "string" },
      device: { type: "string" }, cmd: { type: "string" }, import: { type: "string" }, candidate: { type: "string" },
    },
  });
  const { root, lessonId } = rootOf(v);
  await transcribeLang({
    root, lessonId, lang: needLang(v.lang), model: v.model, device: v.device, cmd: v.cmd, importFile: v.import, candidate: v.candidate,
  });
}

function cmdReview(args: string[]): void {
  const [sub, ...rest] = args;
  const { values: v } = parseArgs({
    args: rest,
    options: { lesson: { type: "string" }, lang: { type: "string" }, out: { type: "string" }, by: { type: "string" }, strict: { type: "boolean" }, require: { type: "string" } },
  });
  const { root, lessonId } = rootOf(v);
  if (sub === "status") {
    const review = readReview(root, lessonId);
    const tracks = LANGS.map((l) => review.tracks[l]).filter((t) => t !== undefined);
    if (tracks.length === 0) console.log("No captions yet.");
    for (const t of tracks) {
      console.log(`${t.lang}: ${t.status}${t.machineGenerated ? " (machine-generated)" : ""}, source ${t.source}` + (t.reviewedBy ? `, reviewed by ${t.reviewedBy} at ${t.reviewedAt}` : ""));
    }
  } else if (sub === "approve") {
    try {
      const r = approveTrack({ root, lessonId, lang: needLang(v.lang), by: need(v.by, "--by"), ...(v.strict ? { strict: true } : {}) });
      console.log(`${v.lang}: approved -> ${path.relative(base(), r.publishedFile)}`);
      printIssues(r.issues);
    } catch (e) {
      if (e instanceof ReviewError) {
        console.error(e.message);
        for (const i of e.issues) console.error(`  ${i.severity === "error" ? "ERROR  " : "warning"} ${i.message}`);
        process.exitCode = 1;
      } else throw e;
    }
  } else if (sub === "gate") {
    const require = v.require ? v.require.split(",").map((s) => s.trim()) : [...LANGS];
    if (!require.every(isLang)) fail("--require takes en, am or en,am.");
    const g = checkGate(root, lessonId, require);
    if (g.ok) console.log(`Ready to publish: ${require.join(", ")} reviewed.`);
    else {
      console.log("Not ready to publish:");
      for (const p of g.problems) console.log(`  - ${p}`);
      process.exitCode = 1;
    }
  } else {
    fail(`Unknown review command "${sub ?? ""}".\n\n${USAGE}`);
  }
}

function cmdEval(args: string[]): void {
  const { values: v } = parseArgs({
    args,
    options: { lang: { type: "string", default: "am" }, ref: { type: "string" }, hyp: { type: "string", multiple: true }, out: { type: "string" }, "no-fold": { type: "boolean" } },
  });
  const lang = needLang(v.lang);
  const ref = abs(need(v.ref, "--ref"));
  const hyps = (v.hyp ?? []).map((h) => {
    const eq = h.indexOf("=");
    if (eq < 1) fail(`--hyp must look like name=file, got "${h}".`);
    return { name: h.slice(0, eq), text: loadText(abs(h.slice(eq + 1))) };
  });
  if (hyps.length === 0) fail("Give at least one --hyp name=file.");
  const fold = !v["no-fold"];
  const refText = loadText(ref);
  if (normaliseForEval(refText, { lang, fold }) === "") fail("The reference has no text.");
  const report = renderReport(evaluateCandidates(refText, hyps, { lang, fold }), { lang, reference: path.basename(ref), fold });
  if (v.out) {
    fs.writeFileSync(abs(v.out), report);
    console.log(`Report written to ${v.out}`);
  }
  console.log(report);
}

export async function main(argv: string[]): Promise<void> {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "run": return cmdRun(rest);
    case "ingest": return cmdIngest(rest);
    case "transcribe": return cmdTranscribe(rest);
    case "review": return cmdReview(rest);
    case "eval-asr": return cmdEval(rest);
    default: console.log(USAGE);
  }
}

const isEntry = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main(process.argv.slice(2)).catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  });
}
