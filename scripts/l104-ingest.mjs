#!/usr/bin/env node
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import {
  assertL104MediaStreams,
  assertCaptionCoverage,
  extractL104EnglishScript,
  generateDraftCaptionCues,
  serializeDraftVtt,
} from "./l104-ingest-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? null : process.argv[index + 1];
};
const videoInput = arg("video");
const separateAudioInput = arg("audio");
if (!videoInput) throw new Error("Usage: pnpm l104:ingest --video <L-104.mp4> [--audio <narration-audio-file>]");

function run(command, args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
      child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`${command} exited ${code}${stderr ? `: ${stderr.trim()}` : ""}`));
      else resolve(capture ? stdout.trim() : "");
    });
  });
}

async function probeDuration(file, selector = "") {
  const value = await run("ffprobe", [
    "-v", "error", ...(selector ? ["-select_streams", selector] : []),
    "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file,
  ], { capture: true });
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`ffprobe returned an invalid duration for ${file}.`);
  return duration;
}

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const videoPath = path.resolve(videoInput);
const audioSourcePath = separateAudioInput ? path.resolve(separateAudioInput) : videoPath;
await fs.access(videoPath);
await fs.access(audioSourcePath);

const duration = await probeDuration(videoPath);
if (duration < 120 || duration > 180) {
  throw new Error(`L-104 video duration is ${duration.toFixed(3)}s; required range is 120–180 seconds.`);
}
const videoInfo = JSON.parse(await run("ffprobe", [
  "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "json", videoPath,
], { capture: true })).streams?.[0];
const embeddedAudio = JSON.parse(await run("ffprobe", [
  "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name", "-of", "json", videoPath,
], { capture: true })).streams?.[0];
assertL104MediaStreams(videoInfo, embeddedAudio);
if (separateAudioInput) {
  const audioDuration = await probeDuration(audioSourcePath);
  if (audioDuration < 120 || audioDuration > 180 || Math.abs(audioDuration - duration) > 2) {
    throw new Error(`Separate narration duration ${audioDuration.toFixed(3)}s must be 120–180s and within 2s of video (${duration.toFixed(3)}s).`);
  }
}

const lessonText = await fs.readFile(path.join(root, "docs/production/L-104-digital-learning-safety.md"), "utf8");
const englishScript = extractL104EnglishScript(lessonText);
const cues = generateDraftCaptionCues(englishScript, duration);
const englishVtt = serializeDraftVtt(cues);
assertCaptionCoverage(englishVtt, duration);

const stage = await fs.mkdtemp(path.join(os.tmpdir(), "savanna-l104-ingest-"));
const stagedMedia = path.join(stage, "media");
const stagedLesson = path.join(stage, "lesson");
await fs.mkdir(stagedMedia, { recursive: true });
await fs.mkdir(stagedLesson, { recursive: true });

try {
  const stagedVideo = path.join(stagedMedia, "lesson.mp4");
  const stagedAudio = path.join(stagedMedia, "lesson.opus");
  const stagedVtt = path.join(stagedMedia, "en.vtt");
  await fs.copyFile(videoPath, stagedVideo);
  await fs.writeFile(stagedVtt, englishVtt, "utf8");
  await run("ffmpeg", ["-y", "-i", audioSourcePath, "-vn", "-ac", "1", "-c:a", "libopus", "-b:a", "16k", stagedAudio]);

  const opusProbe = await run("ffprobe", [
    "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name,channels", "-of", "json", stagedAudio,
  ], { capture: true });
  const audioInfo = JSON.parse(opusProbe).streams?.[0];
  if (audioInfo?.codec_name !== "opus" || audioInfo?.channels !== 1) {
    throw new Error("Extracted narration must be Opus mono audio.");
  }
  const opusDuration = await probeDuration(stagedAudio);
  if (opusDuration < 120 || opusDuration > 180 || opusDuration < duration * 0.9) {
    throw new Error(`Extracted Opus audio duration ${opusDuration.toFixed(3)}s does not cover at least 90% of the ${duration.toFixed(3)}s lesson.`);
  }
  const transcript = {
    id: "L-104",
    lang: "en",
    lines: cues.map(({ start, end, text }) => ({ start, end, text: text.replaceAll("\n", " ") })),
  };
  // Match the API transcript route's stable JSON bytes so the same SHA-256 verifies online and offline.
  await fs.writeFile(path.join(stagedLesson, "transcript.json"), JSON.stringify(transcript, null, 2));

  const assets = [
    ["lesson.mp4", stagedVideo],
    ["lesson.opus", stagedAudio],
    ["en.vtt", stagedVtt],
    ["transcript.json", path.join(stagedLesson, "transcript.json")],
  ];
  const packFiles = [];
  for (const [name, source] of assets) {
    const bytes = await fs.readFile(source);
    packFiles.push({ path: name, sizeBytes: bytes.byteLength, sha256: sha256(bytes) });
    if (source !== path.join(stagedLesson, "transcript.json")) await fs.copyFile(source, path.join(stagedLesson, name));
  }
  const pack = {
    id: "L-104",
    version: 1,
    createdAt: new Date().toISOString(),
    sizeBytes: packFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
    content: {
      video: "lesson.mp4", audio: "lesson.opus", captions: { en: "en.vtt" },
      transcript: "transcript.json", audioDescription: null, signLanguage: null,
    },
    files: packFiles,
  };
  await fs.writeFile(path.join(stagedLesson, "pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream(path.join(stagedLesson, "pack.zip"));
    const archive = archiver("zip", { zlib: { level: 6 } });
    output.on("close", resolve).on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    for (const [name, source] of assets) archive.file(source, { name });
    archive.file(path.join(stagedLesson, "pack.json"), { name: "pack.json" });
    void archive.finalize();
  });

  const manifest = {
    id: "L-104",
    title: { en: "Digital Learning and Internet Safety", am: "L-104" },
    durationSec: Math.ceil(duration),
    media: { video: "/media/L-104/lesson.mp4", audio: "/media/L-104/lesson.opus" },
    captions: [{ lang: "en", url: "/media/L-104/en.vtt" }],
    sign: null,
    audioDescription: null,
    transcript: { url: "/v1/lessons/L-104/transcript" },
    pack: { manifestUrl: "/v1/lessons/L-104/pack", sizeBytes: pack.sizeBytes },
  };
  const stagedManifest = path.join(stage, "L-104.json");
  await fs.writeFile(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`);

  const mediaRoot = path.join(root, "contracts/fixtures/media/L-104");
  const lessonRoot = path.join(root, "contracts/fixtures/v1/lessons/L-104");
  await fs.mkdir(mediaRoot, { recursive: true });
  await fs.mkdir(lessonRoot, { recursive: true });
  for (const [name, source] of assets.slice(0, 3)) await fs.copyFile(source, path.join(mediaRoot, name));
  for (const name of ["transcript.json", "pack.json", "pack.zip", "lesson.mp4", "lesson.opus", "en.vtt"]) {
    await fs.copyFile(path.join(stagedLesson, name), path.join(lessonRoot, name));
  }
  // Publish the lesson route last. Until this succeeds, the API cannot expose L-104.
  const manifestPath = path.join(root, "contracts/fixtures/v1/lessons/L-104.json");
  const manifestTempPath = `${manifestPath}.tmp`;
  await fs.copyFile(stagedManifest, manifestTempPath);
  await fs.rename(manifestTempPath, manifestPath);

  const videoBytes = (await fs.stat(path.join(mediaRoot, "lesson.mp4"))).size;
  const audioBytes = (await fs.stat(path.join(mediaRoot, "lesson.opus"))).size;
  console.log("L-104 ingest completed.");
  console.log(`  Video duration: ${duration.toFixed(3)} s (allowed range: 120–180 s)`);
  console.log(`  Video: ${videoBytes} B; mono Opus narration: ${audioBytes} B`);
  console.log(`  English timing draft: ${cues.length} cues; last cue ${cues.at(-1).end.toFixed(3)} s`);
  console.log("  Amharic captions: not generated; the current translation is not approved for timing.");
  console.log("  Audio description and Ethiopian Sign Language: unavailable; no production recordings were supplied.");
  console.log(`  Offline pack: ${pack.sizeBytes} B unpacked; pack.zip ${ (await fs.stat(path.join(lessonRoot, "pack.zip"))).size } B`);
} finally {
  await fs.rm(stage, { recursive: true, force: true });
}
