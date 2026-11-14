import { describe, expect, it } from "vitest";
import { formatTimestamp, parseSrt, parseVtt, writeVtt } from "../src/transcribe/vtt";

describe("WebVTT", () => {
  it("formats timestamps", () => {
    expect(formatTimestamp(0)).toBe("00:00:00.000");
    expect(formatTimestamp(61.5)).toBe("00:01:01.500");
    expect(formatTimestamp(3725.042)).toBe("01:02:05.042");
  });

  it("writes a header, language, optional draft note and numbered cues", () => {
    const text = writeVtt([{ start: 1, end: 3.25, lines: ["Hello", "there"] }], { lang: "en", draft: true });
    expect(text.startsWith("WEBVTT\nKind: captions\nLanguage: en\n")).toBe(true);
    expect(text).toContain("NOTE\nDRAFT");
    expect(text).toContain("1\n00:00:01.000 --> 00:00:03.250\nHello\nthere\n");
  });

  it("round-trips text, including Amharic and characters that need escaping", () => {
    const cues = [
      { start: 0, end: 2, lines: ["Tom & Jerry <3"] },
      { start: 2.5, end: 5, lines: ["ዛሬ ስለ ውሃ እንማራለን።"] },
    ];
    const back = parseVtt(writeVtt(cues, { lang: "am" }));
    expect(back.issues).toEqual([]);
    expect(back.cues).toEqual(cues);
  });

  it("reads a draft back without the draft note being a cue", () => {
    const parsed = parseVtt(writeVtt([{ start: 0, end: 2, lines: ["a"] }], { lang: "en", draft: true }));
    expect(parsed.cues).toHaveLength(1);
  });

  it("reads files made elsewhere: BOM, CRLF, cue ids, settings, short timestamps", () => {
    const text = "\uFEFFWEBVTT\r\n\r\nintro\r\n00:01.000 --> 00:03.000 align:start\r\nHello\r\n\r\n00:00:04.000 --> 00:00:06.000\r\nWorld\r\n";
    const { cues, issues } = parseVtt(text);
    expect(issues).toEqual([]);
    expect(cues).toEqual([
      { start: 1, end: 3, lines: ["Hello"] },
      { start: 4, end: 6, lines: ["World"] },
    ]);
  });

  it("removes formatting tags and says so", () => {
    const { cues, issues } = parseVtt("WEBVTT\n\n00:00:00.000 --> 00:00:02.000\n<i>Hello</i> <c.yellow>there</c>\n");
    expect(cues[0]?.lines).toEqual(["Hello there"]);
    expect(issues.map((i) => i.code)).toEqual(["markup-removed"]);
  });

  it("turns broken input into issues, not exceptions", () => {
    expect(parseVtt("Hello").issues[0]?.code).toBe("not-vtt");
    const r = parseVtt("WEBVTT\n\n00:00:00.000 --> oops\nHi\n\nstray words\n");
    expect(r.issues.map((i) => i.code).sort()).toEqual(["bad-timing-line", "stray-block"]);
  });

  it("reads SRT", () => {
    const { cues } = parseSrt("1\n00:00:01,000 --> 00:00:02,500\nHello\n\n2\n00:00:03,000 --> 00:00:04,000\nBye\n");
    expect(cues).toEqual([
      { start: 1, end: 2.5, lines: ["Hello"] },
      { start: 3, end: 4, lines: ["Bye"] },
    ]);
  });
});
