import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cer, editCounts, evaluateCandidates, foldHomophones, loadText, normaliseForEval, renderReport, wer } from "../src/transcribe/eval";
import { tmpDir } from "./helpers";

const am = { lang: "am" as const };
const en = { lang: "en" as const };

describe("normaliseForEval", () => {
  it("ignores case and punctuation in English", () => {
    expect(normaliseForEval("Hello, World! Don't stop.", en)).toBe("hello world dont stop");
  });
  it("ignores Ethiopic punctuation and the Ethiopic word separator", () => {
    expect(normaliseForEval("ዛሬ፡ስለ ውሃ፣ እንማራለን።", am)).toBe("ዛሬ ስለ ውሃ እንማራለን");
  });
  it("folds letters that sound the same, unless told not to", () => {
    expect(foldHomophones("ሠላም")).toBe("ሰላም");
    expect(foldHomophones("ሐ ኀ")).toBe("ሀ ሀ");
    expect(foldHomophones("ዐ ፀ")).toBe("አ ጸ");
    expect(normaliseForEval("ሠላም", am)).toBe("ሰላም");
    expect(normaliseForEval("ሠላም", { ...am, fold: false })).toBe("ሠላም");
  });
  it("keeps the vowel order when folding", () => {
    expect(foldHomophones("ሡ")).toBe("ሱ"); // ሡ (U+1221) -> ሱ (U+1231)
  });
});

describe("error rates", () => {
  it("counts substitutions, deletions and insertions", () => {
    const c = editCounts(["a", "b", "c", "d"], ["a", "x", "c"]);
    expect(c.substitutions + c.deletions + c.insertions).toBe(2);
    expect(c.rate).toBeCloseTo(0.5, 5);
    expect(editCounts(["a"], ["a", "b", "c"]).insertions).toBe(2);
    expect(editCounts(["a", "b"], []).deletions).toBe(2);
  });
  it("is zero for identical text and treats empty reference sensibly", () => {
    expect(wer("one two", "One, two.", en).rate).toBe(0);
    expect(editCounts([], []).rate).toBe(0);
    expect(editCounts([], ["x"]).rate).toBe(1);
  });
  it("WER is word level, CER is character level", () => {
    const ref = "ዛሬ ስለ ውሃ እንማራለን";
    const hyp = "ዛሬ ስለ ውሀ እንማራለን";
    expect(wer(ref, hyp, { ...am, fold: false }).rate).toBeCloseTo(0.25, 5);
    expect(cer(ref, hyp, { ...am, fold: false }).rate).toBeCloseTo(1 / 12, 5);
  });
  it("a different spelling of the same sound is not an error when folding", () => {
    expect(wer("ሰላም ለሁሉም", "ሠላም ለሁሉም", am).rate).toBe(0);
    expect(wer("ሰላም ለሁሉም", "ሠላም ለሁሉም", { ...am, fold: false }).rate).toBeGreaterThan(0);
  });
});

describe("evaluateCandidates", () => {
  const reference = "ዛሬ ስለ ውሃ እንማራለን ውሃ ለሕይወት አስፈላጊ ነው";
  const rows = evaluateCandidates(
    reference,
    [
      { name: "bad", text: "ዛሬ ስለ እንማራለን ነው" },
      { name: "good", text: "ዛሬ ስለ ውሃ እንማራለን ውሃ ለሕይወት አስፈላጊ ነው።" },
    ],
    am,
  );
  it("ranks the best engine first", () => {
    expect(rows.map((r) => r.name)).toEqual(["good", "bad"]);
    expect(rows[0]?.wer).toBe(0);
    expect(rows[1]?.deletions).toBeGreaterThan(0);
  });
  it("renders a markdown table with the human-review warning", () => {
    const md = renderReport(rows, { lang: "am", reference: "ref.vtt", fold: true });
    expect(md).toContain("| good | 0.0% | 0.0% |");
    expect(md).toContain("corrected and approved by a person");
  });
});

describe("loadText", () => {
  it("reads txt, vtt and segment json", () => {
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, "a.txt"), "plain text");
    fs.writeFileSync(path.join(dir, "a.vtt"), "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello\nworld\n");
    fs.writeFileSync(path.join(dir, "a.json"), JSON.stringify({ segments: [{ start: 0, end: 1, text: "one" }, { start: 1, end: 2, text: "two" }] }));
    expect(loadText(path.join(dir, "a.txt"))).toBe("plain text");
    expect(loadText(path.join(dir, "a.vtt"))).toBe("Hello world");
    expect(loadText(path.join(dir, "a.json"))).toBe("one two");
  });
});
