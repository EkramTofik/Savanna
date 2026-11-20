import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLessonPackAssets,
  findPackFileIntegrity,
  verifyPackAssetBytes,
} from "./pack-assets.ts";

test("offline pack includes video, audio, both caption languages, and the transcript", () => {
  const assets = buildLessonPackAssets(
    {
      id: "L-102",
      media: { video: "/media/lesson.mp4", audio: "/media/lesson.opus" },
      captions: [
        { lang: "en", url: "/media/en.vtt" },
        { lang: "am", url: "/media/am.vtt" },
      ],
      transcript: { url: "/v1/lessons/L-102/transcript" },
      sign: null,
      audioDescription: null,
    },
    "http://localhost:4010",
    "http://localhost:8080",
  );

  assert.deepEqual(
    assets.map((asset) => asset.kind),
    ["video", "audio", "captions-en", "captions-am", "transcript"],
  );
  assert.equal(assets[0]?.url, "http://localhost:8080/media/lesson.mp4");
  assert.equal(assets.at(-1)?.url, "http://localhost:4010/v1/lessons/L-102/transcript?lang=en");
});

test("optional description and sign assets are included only when the manifest supplies them", () => {
  const assets = buildLessonPackAssets(
    {
      id: "L-103",
      media: { video: "/media/lesson.mp4" },
      sign: { url: "/media/sign.mp4" },
      audioDescription: { audioUrl: "/media/ad.opus", vttUrl: "/media/ad.vtt" },
    },
    "https://api.example.test",
    "https://savanna.example.test",
  );

  assert.deepEqual(
    assets.map((asset) => asset.kind),
    ["video", "sign-language-video", "audio-description", "audio-description-cues"],
  );
  assert.ok(
    assets.every((asset) => new URL(asset.url).origin === "https://savanna.example.test"),
    "media paths must resolve to the page origin so its service worker can cache them",
  );
});

test("offline file integrity matches the pack filename, byte size, and SHA-256", async () => {
  const bytes = new TextEncoder().encode("WEBVTT\n\n");
  const manifest = {
    id: "L-test",
    packMetadata: {
      files: [
        {
          path: "en.vtt",
          sizeBytes: bytes.byteLength,
          sha256: "" as string,
        },
      ],
    },
  };
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  manifest.packMetadata.files[0]!.sha256 = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");

  const integrity = findPackFileIntegrity(manifest, "https://learn.example/media/en.vtt");
  assert.equal(integrity?.path, "en.vtt");
  await verifyPackAssetBytes(bytes.buffer, integrity);
  await assert.rejects(
    verifyPackAssetBytes(new TextEncoder().encode("bad").buffer, integrity),
    /size mismatch/,
  );
  await assert.rejects(
    verifyPackAssetBytes(bytes.buffer, undefined),
    /does not provide a valid checksum/,
  );
});
