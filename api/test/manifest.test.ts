import { describe, expect, it } from "vitest";
import { fromManifest, toManifest } from "../src/lib/manifest";
import type { LessonManifest } from "../src/schemas/lesson";

describe("lesson accessibility asset metadata", () => {
  it("round-trips measured audio-description offsets and sign-language labels", () => {
    const manifest: LessonManifest = {
      id: "L-test-accessibility-assets",
      title: { en: "Test lesson", am: "የሙከራ ትምህርት" },
      durationSec: 150,
      media: { video: "/media/test.mp4", audio: "/media/test.opus" },
      captions: [
        { lang: "en", url: "/media/test-en.vtt" },
        { lang: "am", url: "/media/test-am.vtt" },
      ],
      sign: {
        url: "/media/test-sign.mp4",
        offsetMs: 225,
        languageName: "Verified interpreter label",
      },
      audioDescription: {
        audioUrl: "/media/test-ad.opus",
        vttUrl: "/media/test-ad.vtt",
        extended: false,
        offsetMs: 480,
      },
      transcript: { url: "/v1/lessons/L-test-accessibility-assets/transcript" },
      pack: { manifestUrl: "/v1/lessons/L-test-accessibility-assets/pack", sizeBytes: 0 },
    };

    expect(toManifest(fromManifest(manifest))).toEqual(manifest);
  });
});
