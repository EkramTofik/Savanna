import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDraftFromCues, createDraftFromRaw } from "../src/transcribe/drafts";
import { GateError, ReviewError, approveTrack, assertPublishable, checkGate, draftPath, publishedPath, readReview } from "../src/transcribe/review";
import type { RawTranscript } from "../src/transcribe/types";
import { speak, tmpDir } from "./helpers";

const raw = (lang: "en" | "am", text: string): RawTranscript => ({ lang, engine: "test", machineGenerated: true, segments: [speak(text, 0, 0.4)] });
const setup = () => {
  const root = path.join(tmpDir(), "L-1");
  createDraftFromRaw(root, "L-1", raw("en", "Welcome to the lesson about water"));
  createDraftFromCues(root, "L-1", "am", [{ start: 0, end: 2, lines: ["ዛሬ ስለ ውሃ እንማራለን።"] }], "imported:am.vtt");
  return root;
};

describe("review gate", () => {
  it("starts closed: a new draft is not publishable and no published file exists", () => {
    const root = setup();
    expect(readReview(root, "L-1").tracks.en?.status).toBe("draft");
    expect(readReview(root, "L-1").tracks.en?.machineGenerated).toBe(true);
    expect(readReview(root, "L-1").tracks.am?.machineGenerated).toBe(false);
    expect(fs.existsSync(publishedPath(root, "en"))).toBe(false);
    const g = checkGate(root, "L-1");
    expect(g.ok).toBe(false);
    expect(g.problems).toHaveLength(2);
    expect(() => assertPublishable(root, "L-1")).toThrow(GateError);
  });

  it("opens only when every required language is approved", () => {
    const root = setup();
    approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    expect(checkGate(root, "L-1").ok).toBe(false);
    expect(checkGate(root, "L-1", ["en"]).ok).toBe(true);
    approveTrack({ root, lessonId: "L-1", lang: "am", by: "Abebe" });
    expect(checkGate(root, "L-1").ok).toBe(true);
    const t = readReview(root, "L-1").tracks.am;
    expect(t?.reviewedBy).toBe("Abebe");
    expect(t?.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("writes a clean published file without the draft note", () => {
    const root = setup();
    approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    const text = fs.readFileSync(publishedPath(root, "en"), "utf8");
    expect(text).not.toContain("DRAFT");
    expect(text).toContain("Language: en");
  });

  it("needs a reviewer name", () => {
    const root = setup();
    expect(() => approveTrack({ root, lessonId: "L-1", lang: "en", by: "  " })).toThrow(ReviewError);
  });

  it("refuses to approve a file with errors and lists them", () => {
    const root = setup();
    fs.writeFileSync(draftPath(root, "en"), "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\na\nb\nc\n\n00:00:02.000 --> 00:00:04.000\nx\n");
    let error: unknown;
    try {
      approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ReviewError);
    expect((error as ReviewError).issues.map((i) => i.code).sort()).toEqual(expect.arrayContaining(["overlap", "too-many-lines"]));
    expect(fs.existsSync(publishedPath(root, "en"))).toBe(false);
    expect(readReview(root, "L-1").tracks.en?.status).toBe("draft");
  });

  it("lets a reviewer approve with warnings, but not in strict mode", () => {
    const root = setup();
    fs.writeFileSync(draftPath(root, "en"), "WEBVTT\n\n00:00:00.000 --> 00:00:00.400\nHi\n");
    expect(approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" }).issues.map((i) => i.code)).toEqual(["too-short"]);
    expect(() => approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara", strict: true })).toThrow(ReviewError);
  });

  it("closes again if the draft is edited after approval", () => {
    const root = setup();
    approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    approveTrack({ root, lessonId: "L-1", lang: "am", by: "Abebe" });
    fs.appendFileSync(draftPath(root, "en"), "\n00:00:09.000 --> 00:00:10.000\nSneaky edit\n");
    expect(checkGate(root, "L-1").problems.join(" ")).toContain("edited after approval");
  });

  it("closes again if the published file is tampered with", () => {
    const root = setup();
    approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    fs.appendFileSync(publishedPath(root, "en"), "\n");
    expect(checkGate(root, "L-1", ["en"]).problems.join(" ")).toContain("changed after approval");
  });

  it("withdraws an approval, and deletes its published file, when a new draft is generated", () => {
    const root = setup();
    approveTrack({ root, lessonId: "L-1", lang: "en", by: "Sara" });
    createDraftFromRaw(root, "L-1", raw("en", "A different transcript entirely"));
    expect(fs.existsSync(publishedPath(root, "en"))).toBe(false);
    expect(checkGate(root, "L-1", ["en"]).ok).toBe(false);
  });

  it("explains a missing track", () => {
    const root = path.join(tmpDir(), "L-2");
    expect(checkGate(root, "L-2", ["am"]).problems).toEqual(["am: no captions yet."]);
    expect(() => approveTrack({ root, lessonId: "L-2", lang: "am", by: "x" })).toThrow(ReviewError);
  });
});
