import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main } from "../src/cli";
import { checkGate, lessonRoot } from "../src/transcribe/review";
import { FAKE_ASR as FAKE, hasFfmpeg, makeVideo, tmpDir } from "./helpers";
const cmd = `"${process.execPath}" "${FAKE}" --audio {audio} --lang {lang} --out {out}`;

afterEach(() => {
  process.exitCode = 0;
});

describe.skipIf(!hasFfmpeg)("pipeline run: one lesson from MP4 to reviewed EN and AM captions", () => {
  it("goes through ingest, transcribe, drafts, review and the gate", async () => {
    const dir = tmpDir();
    const out = path.join(dir, "out");
    makeVideo(path.join(dir, "lesson.mp4"), 12, 25, true);
    const root = lessonRoot(out, "L-9");

    await main(["run", "--video", path.join(dir, "lesson.mp4"), "--lesson", "L-9", "--out", out, "--en-cmd", cmd, "--am-cmd", cmd]);

    expect(fs.existsSync(path.join(root, "ingest", "audio.wav"))).toBe(true);
    expect(fs.existsSync(path.join(root, "captions", "en.draft.vtt"))).toBe(true);
    expect(fs.existsSync(path.join(root, "captions", "am.draft.vtt"))).toBe(true);
    const en = fs.readFileSync(path.join(root, "captions", "en.draft.vtt"), "utf8");
    expect(en).toContain("DRAFT");
    expect(en).toContain("Welcome to this lesson");

    // drafts are not publishable
    await main(["review", "gate", "--lesson", "L-9", "--out", out]);
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;

    await main(["review", "approve", "--lesson", "L-9", "--lang", "en", "--by", "Sara", "--out", out]);
    await main(["review", "approve", "--lesson", "L-9", "--lang", "am", "--by", "Abebe", "--out", out]);
    expect(process.exitCode ?? 0).toBe(0);
    expect(checkGate(root, "L-9").ok).toBe(true);
    expect(fs.existsSync(path.join(root, "captions", "en.vtt"))).toBe(true);
    expect(fs.readFileSync(path.join(root, "captions", "am.vtt"), "utf8")).toContain("ዛሬ ስለ ውሃ እንማራለን።");
  });

  it("saves an Amharic candidate without touching drafts or review state", async () => {
    const dir = tmpDir();
    const out = path.join(dir, "out");
    makeVideo(path.join(dir, "lesson.mp4"), 12, 25, true);
    const root = lessonRoot(out, "L-9");
    await main(["run", "--video", path.join(dir, "lesson.mp4"), "--lesson", "L-9", "--out", out, "--en-cmd", cmd]);
    await main(["transcribe", "--lesson", "L-9", "--lang", "am", "--cmd", cmd, "--candidate", "mms", "--out", out]);
    expect(fs.existsSync(path.join(root, "transcribe", "candidates", "am.mms.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, "captions", "am.draft.vtt"))).toBe(false);
  });

  it("refuses Amharic with no engine instead of guessing", async () => {
    const dir = tmpDir();
    const out = path.join(dir, "out");
    makeVideo(path.join(dir, "lesson.mp4"), 12, 25, true);
    await main(["run", "--video", path.join(dir, "lesson.mp4"), "--lesson", "L-9", "--out", out, "--en-cmd", cmd]);
    await expect(main(["transcribe", "--lesson", "L-9", "--lang", "am", "--out", out])).rejects.toThrow(/No Amharic engine/);
  });
});

describe("eval-asr command", () => {
  it("scores candidates against a reference and writes a report", async () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, "ref.txt"), "ዛሬ ስለ ውሃ እንማራለን");
    fs.writeFileSync(path.join(dir, "a.txt"), "ዛሬ ስለ ውሃ እንማራለን");
    fs.writeFileSync(path.join(dir, "b.txt"), "ዛሬ ውሃ");
    await main(["eval-asr", "--lang", "am", "--ref", path.join(dir, "ref.txt"), "--hyp", `a=${path.join(dir, "a.txt")}`, "--hyp", `b=${path.join(dir, "b.txt")}`, "--out", path.join(dir, "r.md")]);
    const md = fs.readFileSync(path.join(dir, "r.md"), "utf8");
    expect(md.indexOf("| a |")).toBeLessThan(md.indexOf("| b |"));
  });
  it("reports a bad --hyp argument", async () => {
    await expect(main(["eval-asr", "--ref", "x", "--hyp", "nofile"])).rejects.toThrow();
  });
});
