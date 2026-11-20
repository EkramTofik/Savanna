export interface LessonPackManifest {
  id: string;
  title?: { en?: string; am?: string };
  durationSec?: number;
  media?: { video?: string; audio?: string };
  captions?: Array<{ lang: string; url: string }>;
  sign?: { url?: string } | null;
  audioDescription?: { audioUrl?: string; vttUrl?: string } | null;
  transcript?: { url?: string } | null;
  packMetadata?: {
    files?: Array<{ path: string; sizeBytes: number; sha256: string }>;
  };
}

export interface LessonPackAsset {
  kind: string;
  url: string;
}

export interface PackFileIntegrity {
  path: string;
  sizeBytes: number;
  sha256: string;
}

/** Match a manifest asset to its declared pack file by its repository pack filename. */
export function findPackFileIntegrity(
  manifest: LessonPackManifest,
  assetUrl: string,
): PackFileIntegrity | undefined {
  let filename: string;
  try {
    const pathname = new URL(assetUrl).pathname;
    filename = pathname.endsWith("/transcript")
      ? "transcript.json"
      : decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return undefined;
  }
  return manifest.packMetadata?.files?.find((file) => file.path === filename);
}

/** Validate downloaded bytes against the size and SHA-256 declared by the lesson pack. */
export async function verifyPackAssetBytes(
  bytes: ArrayBuffer,
  expected: PackFileIntegrity | undefined,
): Promise<void> {
  if (!expected || !Number.isSafeInteger(expected.sizeBytes) || !/^[a-f\d]{64}$/i.test(expected.sha256)) {
    throw new Error("The offline pack does not provide a valid checksum for this file.");
  }
  if (bytes.byteLength !== expected.sizeBytes) {
    throw new Error(
      `${expected.path} size mismatch (expected ${expected.sizeBytes} bytes, received ${bytes.byteLength}).`,
    );
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot verify offline file checksums.");
  }
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
  if (actual.toLowerCase() !== expected.sha256.toLowerCase()) {
    throw new Error(`${expected.path} failed its SHA-256 checksum check.`);
  }
}

/** List the real lesson files for the browser cache. Missing optional tracks stay missing. */
export function buildLessonPackAssets(
  manifest: LessonPackManifest,
  apiBase: string,
  mediaBase = apiBase,
): LessonPackAsset[] {
  const base = apiBase.replace(/\/$/, "") + "/";
  const assets: LessonPackAsset[] = [];
  const seen = new Set<string>();
  const add = (kind: string, value?: string | null) => {
    if (!value) return;
    const targetBase = value.startsWith("/media/") ? `${mediaBase.replace(/\/$/, "")}/` : base;
    const url = new URL(value, targetBase).href;
    if (seen.has(url)) return;
    seen.add(url);
    assets.push({ kind, url });
  };

  add("video", manifest.media?.video);
  add("audio", manifest.media?.audio);
  for (const caption of manifest.captions ?? []) {
    if (caption.lang === "am" || caption.lang === "en")
      add(`captions-${caption.lang}`, caption.url);
  }
  add("sign-language-video", manifest.sign?.url);
  add("audio-description", manifest.audioDescription?.audioUrl);
  add("audio-description-cues", manifest.audioDescription?.vttUrl);
  if (manifest.transcript?.url) {
    const url = new URL(manifest.transcript.url, base);
    url.searchParams.set("lang", "en");
    add("transcript", url.href);
  }
  return assets;
}
