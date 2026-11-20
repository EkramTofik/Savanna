import type { LessonManifest } from '../player/lesson-manifest.ts';

export interface PackFile {
  path: string;
  sizeBytes: number;
  sha256: string;
}

export interface PackManifest {
  id: string;
  version: number;
  sizeBytes: number;
  files: PackFile[];
}

export interface OfflineResource {
  url: string;
  expectedBytes?: number;
  expectedSha256: string;
  headers?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate the pack index before it can drive resource requests or storage use. */
export function parsePackManifest(value: unknown, expectedId: string): PackManifest {
  if (!isRecord(value) || value.id !== expectedId) throw new Error('The offline pack belongs to a different lesson.');
  if (!Number.isSafeInteger(value.version) || (value.version as number) < 1) throw new Error('The offline pack version is invalid.');
  if (!Number.isSafeInteger(value.sizeBytes) || (value.sizeBytes as number) < 0) throw new Error('The offline pack size is invalid.');
  if (!Array.isArray(value.files)) throw new Error('The offline pack file list is missing.');
  const paths = new Set<string>();
  const files = value.files.map((file): PackFile => {
    if (!isRecord(file) || typeof file.path !== 'string' || !file.path || file.path.includes('..') || file.path.startsWith('/') || file.path.includes('\\')) {
      throw new Error('The offline pack contains an unsafe file path.');
    }
    const bytes = file.sizeBytes ?? file.bytes;
    if (!Number.isSafeInteger(bytes) || (bytes as number) < 0) throw new Error(`The offline pack size for ${file.path} is invalid.`);
    if (typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(file.sha256)) throw new Error(`The offline pack checksum for ${file.path} is invalid.`);
    if (paths.has(file.path)) throw new Error(`The offline pack contains ${file.path} more than once.`);
    paths.add(file.path);
    return { path: file.path, sizeBytes: bytes as number, sha256: file.sha256.toLowerCase() };
  });
  if (files.reduce((sum, file) => sum + file.sizeBytes, 0) !== value.sizeBytes) {
    throw new Error('The offline pack size does not match the sum of its files.');
  }
  return { id: expectedId, version: value.version as number, sizeBytes: value.sizeBytes as number, files };
}

/** Resolve only files listed in the pack index to their C1/API resource URLs. */
export function buildPackResources(manifest: LessonManifest, pack: PackManifest, api: string, apiKey: string): OfflineResource[] {
  const resources: OfflineResource[] = [];
  const apiBase = new URL(api, globalThis.location?.href ?? 'http://localhost/');
  const mediaUrl = (filePath: string) => {
    const encodedPath = filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
    return new URL(`/media/${encodedPath}`, apiBase).href;
  };
  for (const file of pack.files) {
    const name = file.path.split('/').pop()!.toLowerCase();
    let url: string | undefined;
    if (/^(lesson|lesson-audio)\.opus$/.test(name)) url = manifest.media.audio || mediaUrl(file.path);
    else if (/^(en|captions-en)\.vtt$/.test(name)) url = manifest.captions.find((track) => track.lang === 'en')?.url ?? mediaUrl(file.path);
    else if (/^(am|captions-am)\.vtt$/.test(name)) url = manifest.captions.find((track) => track.lang === 'am')?.url ?? mediaUrl(file.path);
    else if (name === 'ad.opus') {
      if (!manifest.audioDescription) throw new Error(`The offline pack file “${file.path}” is not declared in the lesson manifest.`);
      url = manifest.audioDescription.audioUrl;
    }
    else if (name === 'ad.vtt') {
      if (!manifest.audioDescription) throw new Error(`The offline pack file “${file.path}” is not declared in the lesson manifest.`);
      url = manifest.audioDescription.vttUrl;
    }
    else if (/^sign\.(mp4|webm)$/.test(name)) {
      if (!manifest.sign) throw new Error(`The offline pack file “${file.path}” is not declared in the lesson manifest.`);
      url = manifest.sign.url;
    }
    else if (/^lesson-240p\.(mp4|webm)$/.test(name)) url = mediaUrl(file.path);
    else if (name === 'transcript.html') {
      // The component derives the interactive transcript from the cached VTT files.
      continue;
    }
    if (!url && manifest.sign && new URL(manifest.sign.url).pathname.split('/').pop()?.toLowerCase() === name) url = manifest.sign.url;
    if (!url) throw new Error(`The offline pack file “${file.path}” is not declared in the lesson manifest.`);
    resources.push({ url, expectedBytes: file.sizeBytes, expectedSha256: file.sha256 });
  }
  if (resources.length === 0) throw new Error('This lesson pack does not contain any downloadable resources.');
  return resources;
}
