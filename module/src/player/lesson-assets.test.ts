import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { parseWebVtt } from "./vtt-parser.ts";

const fixture = (path: string) => new URL(`../../../contracts/fixtures/${path}`, import.meta.url);

test("L-102 lesson duration, captions, and offline manifest agree with the media package", async () => {
  const lesson = JSON.parse(await readFile(fixture("v1/lessons/L-102.json"), "utf8"));
  const pack = JSON.parse(await readFile(fixture("v1/lessons/L-102/pack.json"), "utf8"));
  const english = parseWebVtt(await readFile(fixture("media/en.vtt"), "utf8"));
  const amharic = parseWebVtt(await readFile(fixture("media/am.vtt"), "utf8"));

  assert.equal(lesson.durationSec, 120);
  for (const cues of [english, amharic]) {
    assert.ok(
      cues.length >= 10,
      "Each caption track should cover the lesson, not only an opening sample",
    );
    assert.equal(cues.at(-1)?.end, lesson.durationSec);
    assert.ok(
      cues.every(
        (cue, index) => cue.end > cue.start && (!index || cue.start >= cues[index - 1]!.start),
      ),
    );
  }
  assert.match(amharic.map((cue) => cue.text).join(" "), /[\u1200-\u137f]/u);
  assert.equal(lesson.sign, null);
  assert.equal(lesson.audioDescription, null);

  const actualSizes: number[] = [];
  for (const item of pack.files) {
    const url =
      item.path === "transcript.json"
        ? fixture("v1/lessons/L-102/transcript.json")
        : fixture(`media/${item.path}`);
    const content = await readFile(url);
    assert.equal(
      content.byteLength,
      item.sizeBytes,
      `${item.path} size should match pack metadata`,
    );
    assert.equal(
      createHash("sha256").update(content).digest("hex"),
      item.sha256,
      `${item.path} checksum should match`,
    );
    actualSizes.push((await stat(url)).size);
  }
  assert.equal(
    pack.sizeBytes,
    actualSizes.reduce((total, size) => total + size, 0),
  );
  assert.equal(lesson.pack.sizeBytes, pack.sizeBytes);
});

test("L-103 transcript checksum and offline pack total match the actual fixture bytes", async () => {
  const lesson = JSON.parse(await readFile(fixture("v1/lessons/L-103.json"), "utf8"));
  const pack = JSON.parse(await readFile(fixture("v1/lessons/L-103/pack.json"), "utf8"));
  const transcript = JSON.parse(
    await readFile(fixture("v1/lessons/L-103/transcript.json"), "utf8"),
  );

  assert.equal(lesson.durationSec, 120);
  assert.equal(transcript.id, "L-103");

  const actualSizes: number[] = [];
  for (const item of pack.files) {
    const url =
      item.path === "transcript.json"
        ? fixture("v1/lessons/L-103/transcript.json")
        : fixture(`media/${item.path}`);
    const content = await readFile(url);
    assert.equal(
      content.byteLength,
      item.sizeBytes,
      `${item.path} size should match pack metadata`,
    );
    assert.equal(
      createHash("sha256").update(content).digest("hex"),
      item.sha256,
      `${item.path} checksum should match`,
    );
    actualSizes.push(content.byteLength);
  }

  assert.equal(
    pack.sizeBytes,
    actualSizes.reduce((total, size) => total + size, 0),
  );
  assert.equal(lesson.pack.sizeBytes, pack.sizeBytes);
});
