import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertL104MediaStreams,
  assertCaptionCoverage,
  extractL104EnglishScript,
  generateDraftCaptionCues,
  serializeDraftVtt,
} from "./l104-ingest-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("L-104 ingest requires H.264 video with embedded AAC English narration", () => {
  assert.doesNotThrow(() => assertL104MediaStreams({ codec_name: "h264" }, { codec_name: "aac" }));
  assert.throws(() => assertL104MediaStreams({ codec_name: "vp9" }, { codec_name: "aac" }), /H\.264/);
  assert.throws(() => assertL104MediaStreams({ codec_name: "h264" }, undefined), /include its English narration/);
  assert.throws(() => assertL104MediaStreams({ codec_name: "h264" }, { codec_name: "opus" }), /must use AAC/);
});

test("L-104 script creates short review-marked English timing drafts", async () => {
  const markdown = await fs.readFile(path.join(root, "docs/production/L-104-digital-learning-safety.md"), "utf8");
  const script = extractL104EnglishScript(markdown);
  assert.equal(script.trim().split(/\s+/).length, 319);
  const cues = generateDraftCaptionCues(script, 150);
  const vtt = serializeDraftVtt(cues);
  assert.match(vtt, /Timing draft, must be checked against the recording\. reviewed=false/);
  for (const cue of cues) {
    assert.ok(cue.end - cue.start >= 1 && cue.end - cue.start <= 7);
    const lines = cue.text.split("\n");
    assert.ok(lines.length <= 2);
    assert.ok(lines.every((line) => line.length <= 32));
  }
  assert.ok(assertCaptionCoverage(vtt, 150) >= 135);
  assert.throws(
    () => assertCaptionCoverage(serializeDraftVtt([{ start: 0, end: 100, text: "Early end" }]), 150),
    /before 90%/,
  );
  assert.throws(() => generateDraftCaptionCues(script, 119), /120 and 180/);
  assert.throws(() => generateDraftCaptionCues(script, 181), /120 and 180/);
});

test("L-104 production caption coverage reaches at least 90% of the recording", async (t) => {
  const mediaDir = path.join(root, "contracts/fixtures/media/L-104");
  const manifestPath = path.join(root, "contracts/fixtures/v1/lessons/L-104.json");
  const required = [
    manifestPath,
    path.join(mediaDir, "lesson.mp4"),
    path.join(mediaDir, "lesson.opus"),
    path.join(mediaDir, "en.vtt"),
  ];
  const present = await Promise.all(required.map(async (file) => fs.access(file).then(() => true, () => false)));
  if (!present.some(Boolean)) {
    t.skip("L-104 production files are not present yet; coverage test will run after a successful ingest.");
    return;
  }
  assert.ok(present.every(Boolean), "L-104 publication is partial; rerun the ingest to supply all required assets.");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const vtt = await fs.readFile(path.join(mediaDir, "en.vtt"), "utf8");
  assertCaptionCoverage(vtt, manifest.durationSec);
});
