import { describe, expect, it } from "vitest";
import { buildCues, checkCues, formatCues, layoutLines, tokenize } from "../src/transcribe/cues";
import { glen } from "../src/transcribe/text";
import { speak } from "./helpers";

const LONG =
  "Welcome to this lesson about how clean water reaches a village. First we look at the river, then the pump, " +
  "and last the storage tank. Remember to keep the tank covered so that insects and dirt cannot get in.";

describe("tokenize", () => {
  it("uses word timings when the engine gives them", () => {
    const t = tokenize([speak("good morning everyone", 2)]);
    expect(t.map((x) => x.text)).toEqual(["good", "morning", "everyone"]);
    expect(t[0]?.start).toBeCloseTo(2, 3);
  });
  it("shares a segment's time out by word length when there are no word timings", () => {
    const t = tokenize([{ start: 0, end: 4, text: "aa bbbbbb" }]);
    expect(t).toHaveLength(2);
    expect(t[0]?.end).toBeCloseTo(1, 3);
    expect(t[1]?.end).toBeCloseTo(4, 3);
  });
  it("does not let a word overlap the previous one", () => {
    const t = tokenize([{ start: 0, end: 2, text: "a b", words: [{ text: "a", start: 0, end: 1.2 }, { text: "b", start: 1, end: 2 }] }]);
    expect(t[1]?.start).toBeGreaterThanOrEqual(t[0]?.end ?? 0);
  });
  it("does not paint a long pause onto the last word", () => {
    const t = tokenize([{ start: 0, end: 12, text: "hello", words: [{ text: "hello", start: 0, end: 12 }] }]);
    expect(t[0]?.end).toBeLessThan(2.5);
  });
});

describe("layoutLines", () => {
  it("keeps short text on one line", () => {
    expect(layoutLines(["good", "morning"], 32, 2)).toEqual(["good morning"]);
  });
  it("balances two lines and never exceeds the line length", () => {
    const lines = layoutLines("The quick brown fox jumps over the lazy dog today".split(" "), 32, 2);
    expect(lines).toHaveLength(2);
    for (const l of lines ?? []) expect(glen(l)).toBeLessThanOrEqual(32);
  });
  it("prefers to break after a comma", () => {
    const lines = layoutLines("First we look at the river, then the pump and the tank".split(" "), 32, 2);
    expect(lines?.[0]).toBe("First we look at the river,");
  });
  it("returns null when the words cannot fit", () => {
    expect(layoutLines(Array(30).fill("word"), 32, 2)).toBeNull();
  });
  it("measures Amharic by characters, not bytes", () => {
    const words = "ዛሬ ስለ ውሃ እንማራለን ውሃ ለሕይወት አስፈላጊ ነው".split(" ");
    const lines = layoutLines(words, 32, 2);
    expect(lines).not.toBeNull();
    for (const l of lines ?? []) expect(glen(l)).toBeLessThanOrEqual(32);
  });
});

describe("formatCues: SRS limits (2 lines, 32 chars, 1 to 7 s)", () => {
  const cues = formatCues([speak(LONG, 0, 0.33)]);

  it("produces cues", () => expect(cues.length).toBeGreaterThan(2));
  it("never has more than 2 lines or a line over 32 characters", () => {
    for (const c of cues) {
      expect(c.lines.length).toBeLessThanOrEqual(2);
      for (const l of c.lines) expect(glen(l)).toBeLessThanOrEqual(32);
    }
  });
  it("keeps every cue between 1 and 7 seconds", () => {
    for (const c of cues) {
      expect(c.end - c.start).toBeGreaterThanOrEqual(0.999);
      expect(c.end - c.start).toBeLessThanOrEqual(7.001);
    }
  });
  it("keeps cues in order without overlap", () => {
    cues.forEach((c, i) => {
      if (i > 0) expect(c.start).toBeGreaterThanOrEqual(cues[i - 1]?.end ?? 0);
    });
  });
  it("loses no words", () => {
    const out = cues.map((c) => c.lines.join(" ")).join(" ");
    expect(out).toBe(LONG);
  });
  it("passes its own validator with no errors or warnings", () => {
    expect(checkCues(cues)).toEqual([]);
  });
});

describe("formatCues: timing rules", () => {
  it("starts a new cue after a long silence", () => {
    const cues = formatCues([speak("hello there everyone", 0, 0.4), speak("and welcome back", 6, 0.4)]);
    expect(cues).toHaveLength(2);
    expect(cues[1]?.start).toBeCloseTo(6, 2);
  });
  it("splits a long monologue so no cue is over 7 seconds", () => {
    const cues = formatCues([speak(Array(60).fill("slowly").join(" "), 0, 0.9)]);
    for (const c of cues) expect(c.end - c.start).toBeLessThanOrEqual(7.001);
  });
  it("holds a very short cue on screen for 1 second when the next cue is far enough away", () => {
    const cues = buildCues([
      { text: "Yes.", start: 0, end: 0.3 },
      { text: "Next", start: 5, end: 5.4 },
      { text: "part.", start: 5.4, end: 5.8 },
    ]);
    expect(cues[0]?.end).toBeCloseTo(1, 2);
  });
  it("merges a too-short sentence into the next when they are close", () => {
    const cues = buildCues([
      { text: "Yes.", start: 0, end: 0.3 },
      { text: "Now", start: 0.5, end: 0.8 },
      { text: "listen.", start: 0.8, end: 1.3 },
    ]);
    expect(cues).toHaveLength(1);
    expect(cues[0]?.lines.join(" ")).toBe("Yes. Now listen.");
  });
  it("does not run the last cue past the end of the media", () => {
    const cues = formatCues([speak("bye", 9.5, 0.2)], { endLimit: 10 });
    expect(cues[0]?.end).toBeLessThanOrEqual(10);
  });
  it("formats Amharic text and breaks at the Ethiopic full stop", () => {
    const cues = formatCues([
      { start: 0, end: 3, text: "ዛሬ ስለ ውሃ እንማራለን።" },
      { start: 3.2, end: 6, text: "ውሃ ለሕይወት አስፈላጊ ነው።" },
    ]);
    expect(cues).toHaveLength(2);
    expect(cues[0]?.lines.join(" ")).toBe("ዛሬ ስለ ውሃ እንማራለን።");
  });
});

describe("checkCues", () => {
  const ok = { start: 0, end: 2, lines: ["Hello"] };
  const codes = (cues: Parameters<typeof checkCues>[0], ctx = {}) => checkCues(cues, {}, ctx).map((i) => i.code);

  it("reports an empty file", () => expect(codes([])).toEqual(["no-cues"]));
  it("reports empty text", () => expect(codes([{ ...ok, lines: [" "] }])).toContain("empty-cue"));
  it("reports bad and overlapping timing", () => {
    expect(codes([{ start: 2, end: 1, lines: ["a"] }])).toContain("bad-timing");
    expect(codes([ok, { start: 1, end: 3, lines: ["b"] }])).toContain("overlap");
  });
  it("reports 3 lines as an error", () => expect(codes([{ ...ok, lines: ["a", "b", "c"] }])).toContain("too-many-lines"));
  it("reports style limits as warnings only", () => {
    const issues = checkCues([{ start: 0, end: 9, lines: ["x".repeat(40)] }]);
    expect(issues.map((i) => i.code).sort()).toEqual(["line-too-long", "too-long"]);
    expect(issues.every((i) => i.severity === "warning")).toBe(true);
    expect(checkCues([{ start: 0, end: 0.4, lines: ["Hi"] }])[0]?.code).toBe("too-short");
  });
  it("reports cues after the end of the video", () => expect(codes([{ start: 50, end: 52, lines: ["late"] }], { durationSec: 10 })).toContain("beyond-media"));
  it("notices English approved as Amharic and the reverse", () => {
    expect(codes([{ start: 0, end: 2, lines: ["Hello there friends"] }], { lang: "am" })).toContain("language-mismatch");
    expect(codes([{ start: 0, end: 2, lines: ["ዛሬ ስለ ውሃ እንማራለን።"] }], { lang: "en" })).toContain("language-mismatch");
    expect(codes([{ start: 0, end: 2, lines: ["ዛሬ ስለ ውሃ እንማራለን።"] }], { lang: "am" })).toEqual([]);
  });
});
