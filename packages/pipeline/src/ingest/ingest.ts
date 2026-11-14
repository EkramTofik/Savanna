import fs from "node:fs";
import path from "node:path";
import { run } from "./exec";
import { probeMedia } from "./probe";

/** Sign language video is delivered at this frame rate (SRS FR-P5). */
export const SIGN_FPS = 30;
/** Whisper and most ASR engines expect 16 kHz mono. */
export const ASR_SAMPLE_RATE = 16000;

const BASE = ["-y", "-hide_banner", "-loglevel", "error"];

/** Lesson video, normalised so every browser and phone can play it. */
export function normaliseVideoArgs(input: string, output: string): string[] {
  return [
    ...BASE, "-i", input,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "96k",
    "-movflags", "+faststart",
    output,
  ];
}

/** Interpreter video: 30 fps, no audio track (the lesson's own audio is the only sound). */
export function normaliseSignArgs(input: string, output: string): string[] {
  return [
    ...BASE, "-i", input,
    "-an", "-r", String(SIGN_FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    output,
  ];
}

/** Speech audio for the ASR step. */
export function extractAudioArgs(input: string, output: string): string[] {
  return [...BASE, "-i", input, "-vn", "-ac", "1", "-ar", String(ASR_SAMPLE_RATE), "-c:a", "pcm_s16le", output];
}

export interface IngestOptions {
  lessonId: string;
  video: string;
  sign?: string;
  /** Where the sign video starts relative to the lesson video, in milliseconds (contract C1 `sign.offsetMs`). */
  signOffsetMs?: number;
  /** <out>/<lessonId> */
  root: string;
  ffmpeg?: string;
  ffprobe?: string;
}

export interface IngestResult {
  lessonId: string;
  /** paths below are relative to the lesson folder */
  video: { file: string; durationSec: number; width?: number; height?: number };
  audio: { file: string; sampleRate: number };
  sign: null | { file: string; durationMs: number; offsetMs: number; fps: number };
  warnings: string[];
}

/** SRS section 9 step 1: ingest MP4 plus optional ESL MP4, normalise with ffmpeg, extract audio. */
export async function ingestLesson(o: IngestOptions): Promise<IngestResult> {
  const ffmpeg = o.ffmpeg ?? "ffmpeg";
  const warnings: string[] = [];
  const dir = path.join(o.root, "ingest");
  fs.mkdirSync(dir, { recursive: true });

  const info = await probeMedia(o.video, o.ffprobe);
  if (!info.hasVideo) throw new Error(`${o.video} has no video stream.`);
  if (!info.hasAudio) throw new Error(`${o.video} has no audio, so there is nothing to caption.`);

  await run(ffmpeg, normaliseVideoArgs(o.video, path.join(dir, "video.mp4")));
  await run(ffmpeg, extractAudioArgs(o.video, path.join(dir, "audio.wav")));

  let sign: IngestResult["sign"] = null;
  if (o.sign) {
    const sInfo = await probeMedia(o.sign, o.ffprobe);
    if (!sInfo.hasVideo) throw new Error(`${o.sign} has no video stream.`);
    const offsetMs = o.signOffsetMs ?? 0;
    if (sInfo.fps !== undefined && Math.abs(sInfo.fps - SIGN_FPS) > 0.5) {
      warnings.push(`The sign video is ${sInfo.fps.toFixed(2)} fps; it was converted to ${SIGN_FPS} fps.`);
    }
    const drift = Math.abs(sInfo.durationSec * 1000 + offsetMs - info.durationSec * 1000);
    if (drift > 1000) {
      warnings.push(
        `The sign video (${sInfo.durationSec.toFixed(1)} s, offset ${offsetMs} ms) and the lesson video (${info.durationSec.toFixed(1)} s) end ${(drift / 1000).toFixed(1)} s apart. Check the offset.`,
      );
    }
    await run(ffmpeg, normaliseSignArgs(o.sign, path.join(dir, "sign.mp4")));
    sign = { file: "ingest/sign.mp4", durationMs: Math.round(sInfo.durationSec * 1000), offsetMs, fps: SIGN_FPS };
  }

  const result: IngestResult = {
    lessonId: o.lessonId,
    video: {
      file: "ingest/video.mp4",
      durationSec: Math.round(info.durationSec * 1000) / 1000,
      ...(info.width !== undefined ? { width: info.width } : {}),
      ...(info.height !== undefined ? { height: info.height } : {}),
    },
    audio: { file: "ingest/audio.wav", sampleRate: ASR_SAMPLE_RATE },
    sign,
    warnings,
  };
  fs.writeFileSync(path.join(dir, "ingest.json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}
