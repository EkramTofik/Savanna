import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { importCaptionFile, parseSegments, splitCommand, transcribeWithCommand } from "../src/transcribe/whisper";
import { FAKE_ASR as FAKE, tmpDir } from "./helpers";

describe("parseSegments", () => {
  it("reads openai-whisper JSON (word = text with a leading space)", () => {
    const segs = parseSegments({
      text: " Hello world.",
      segments: [{ id: 0, start: 0, end: 1.5, text: " Hello world.", words: [{ word: " Hello", start: 0, end: 0.6, probability: 0.9 }, { word: " world.", start: 0.7, end: 1.5, probability: 0.9 }] }],
    });
    expect(segs).toEqual([{ start: 0, end: 1.5, text: "Hello world.", words: [{ text: "Hello", start: 0, end: 0.6 }, { text: "world.", start: 0.7, end: 1.5 }] }]);
  });
  it("reads our own layout and segments without words", () => {
    expect(parseSegments({ segments: [{ start: 1, end: 2, text: "ሰላም" }] })).toEqual([{ start: 1, end: 2, text: "ሰላም" }]);
  });
  it("skips empty or malformed segments and rejects output with nothing usable", () => {
    expect(parseSegments({ segments: [{ start: 0, end: 1, text: "ok" }, { start: 1, end: 2, text: "  " }, "junk", { text: "no times" }] })).toHaveLength(1);
    expect(() => parseSegments({ segments: [] })).toThrow();
    expect(() => parseSegments({ nope: 1 })).toThrow();
  });
});

describe("splitCommand", () => {
  it("splits on spaces and honours quotes", () => {
    expect(splitCommand(`python3 "my tool.py" --lang {lang} --name 'a b'`)).toEqual(["python3", "my tool.py", "--lang", "{lang}", "--name", "a b"]);
  });
  it("rejects an unclosed quote", () => {
    expect(() => splitCommand(`run "oops`)).toThrow();
  });
});

describe("transcribeWithCommand", () => {
  it("runs an external engine, fills {audio} {lang} {out}, and reads its JSON", async () => {
    const dir = tmpDir();
    const raw = await transcribeWithCommand({
      template: `"${process.execPath}" "${FAKE}" --audio {audio} --lang {lang} --out {out}`,
      audio: path.join(dir, "a.wav"),
      lang: "am",
      outFile: path.join(dir, "out", "am.json"),
      name: "fake",
    });
    expect(raw.engine).toBe("command:fake");
    expect(raw.machineGenerated).toBe(true);
    expect(raw.segments[0]?.text).toBe("ዛሬ ስለ ውሃ እንማራለን።");
  });
  it("says plainly when the engine is not installed", async () => {
    await expect(
      transcribeWithCommand({ template: "no-such-asr-tool --out {out}", audio: "a.wav", lang: "en", outFile: path.join(tmpDir(), "o.json"), name: "x" }),
    ).rejects.toThrow(/not found/);
  });
});

describe("importCaptionFile", () => {
  it("keeps a human-made vtt exactly as authored", () => {
    const f = path.join(tmpDir(), "am.vtt");
    fs.writeFileSync(f, "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nዛሬ ስለ ውሃ\nእንማራለን።\n");
    const r = importCaptionFile(f, "am");
    expect(r.kind).toBe("cues");
    if (r.kind === "cues") expect(r.cues).toEqual([{ start: 1, end: 4, lines: ["ዛሬ ስለ ውሃ", "እንማራለን።"] }]);
  });
  it("treats segment json as raw ASR-like input", () => {
    const f = path.join(tmpDir(), "x.json");
    fs.writeFileSync(f, JSON.stringify({ segments: [{ start: 0, end: 2, text: "hello" }] }));
    const r = importCaptionFile(f, "en");
    expect(r.kind).toBe("raw");
    if (r.kind === "raw") expect(r.transcript.machineGenerated).toBe(false);
  });
});
