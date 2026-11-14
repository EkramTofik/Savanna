import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractAudioArgs, ingestLesson, normaliseSignArgs, normaliseVideoArgs } from "../src/ingest/ingest";
import { parseProbe, probeMedia } from "../src/ingest/probe";
import { hasFfmpeg, makeVideo, tmpDir } from "./helpers";

describe("parseProbe", () => {
  it("reads duration, streams, size and frame rate", () => {
    expect(
      parseProbe({
        streams: [{ codec_type: "video", width: 1280, height: 720, r_frame_rate: "30000/1001" }, { codec_type: "audio" }],
        format: { duration: "480.25" },
      }),
    ).toEqual({ durationSec: 480.25, hasVideo: true, hasAudio: true, width: 1280, height: 720, fps: 30000 / 1001 });
  });
  it("copes with an audio-only file and missing data", () => {
    expect(parseProbe({ streams: [{ codec_type: "audio" }], format: { duration: "10" } })).toEqual({ durationSec: 10, hasVideo: false, hasAudio: true });
    expect(parseProbe({}).durationSec).toBe(0);
  });
});

describe("ffmpeg arguments", () => {
  it("normalises the lesson video for the web", () => {
    const a = normaliseVideoArgs("in.mov", "out.mp4");
    expect(a).toEqual(expect.arrayContaining(["libx264", "yuv420p", "+faststart", "aac"]));
    expect(a.at(-1)).toBe("out.mp4");
  });
  it("converts the sign video to 30 fps without audio", () => {
    const a = normaliseSignArgs("in.mp4", "sign.mp4");
    expect(a.join(" ")).toContain("-r 30");
    expect(a).toContain("-an");
  });
  it("extracts 16 kHz mono PCM for speech recognition", () => {
    expect(extractAudioArgs("in.mp4", "a.wav").join(" ")).toContain("-ac 1 -ar 16000");
  });
});

describe.skipIf(!hasFfmpeg)("ingestLesson (real ffmpeg)", () => {
  it("normalises video, extracts audio, and processes a sign video", async () => {
    const dir = tmpDir();
    const video = path.join(dir, "lesson.mp4");
    const sign = path.join(dir, "sign.mp4");
    makeVideo(video, 3, 25, true);
    makeVideo(sign, 3, 24, false);
    const root = path.join(dir, "out", "L-1");
    const r = await ingestLesson({ lessonId: "L-1", video, sign, root, signOffsetMs: 100 });

    expect(r.video.durationSec).toBeGreaterThan(2.5);
    expect(fs.existsSync(path.join(root, "ingest", "video.mp4"))).toBe(true);
    expect(fs.existsSync(path.join(root, "ingest", "audio.wav"))).toBe(true);
    const audio = await probeMedia(path.join(root, "ingest", "audio.wav"));
    expect(audio.hasAudio).toBe(true);
    expect(audio.hasVideo).toBe(false);

    const s = await probeMedia(path.join(root, "ingest", "sign.mp4"));
    expect(s.hasAudio).toBe(false);
    expect(Math.round(s.fps ?? 0)).toBe(30);
    expect(r.sign).toMatchObject({ file: "ingest/sign.mp4", offsetMs: 100, fps: 30 });
    expect(r.warnings.join(" ")).toContain("converted to 30 fps");
    expect(JSON.parse(fs.readFileSync(path.join(root, "ingest", "ingest.json"), "utf8")).lessonId).toBe("L-1");
  });

  it("warns when the sign video is far out of step with the lesson", async () => {
    const dir = tmpDir();
    makeVideo(path.join(dir, "a.mp4"), 4, 25, true);
    makeVideo(path.join(dir, "b.mp4"), 1, 30, false);
    const r = await ingestLesson({ lessonId: "L-1", video: path.join(dir, "a.mp4"), sign: path.join(dir, "b.mp4"), root: path.join(dir, "o") });
    expect(r.warnings.join(" ")).toContain("end ");
  });

  it("refuses a video with no audio", async () => {
    const dir = tmpDir();
    makeVideo(path.join(dir, "silent.mp4"), 2, 25, false);
    await expect(ingestLesson({ lessonId: "L-1", video: path.join(dir, "silent.mp4"), root: path.join(dir, "o") })).rejects.toThrow(/no audio/);
  });

  it("explains a missing or unreadable input", async () => {
    await expect(ingestLesson({ lessonId: "L-1", video: "/nonexistent/x.mp4", root: path.join(tmpDir(), "o") })).rejects.toThrow();
  });
});
