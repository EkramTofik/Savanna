import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { RawSegment } from "../src/transcribe/types";

/** One ASR segment with evenly timed words. */
export function speak(text: string, start: number, secPerWord = 0.4): RawSegment {
  const parts = text.split(/\s+/).filter(Boolean);
  const words = parts.map((w, i) => ({ text: ` ${w}`, start: start + i * secPerWord, end: start + (i + 1) * secPerWord }));
  return { start, end: start + parts.length * secPerWord, text, words };
}

export const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "savanna-pipeline-"));

export const hasFfmpeg = (() => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8" });
  return r.status === 0 && r.stdout.includes("libx264");
})();

/** A short test video with a tone, made with ffmpeg's built-in generators. */
export function makeVideo(file: string, seconds: number, fps = 25, withAudio = true): void {
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `testsrc=size=320x240:rate=${fps}:duration=${seconds}`];
  if (withAudio) args.push("-f", "lavfi", "-i", `sine=frequency=440:duration=${seconds}`);
  args.push("-pix_fmt", "yuv420p", "-c:v", "libx264", ...(withAudio ? ["-c:a", "aac"] : []), "-shortest", file);
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
}

/** Path of the stand-in ASR engine used by tests (writes segment JSON like a real engine wrapper would). */
export const FAKE_ASR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fake-asr.mjs");
