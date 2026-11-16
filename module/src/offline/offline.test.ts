import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildPackResources, parsePackManifest } from './offline-pack.ts';
import { parseLessonManifest } from '../player/lesson-manifest.ts';

async function fixture(name: string): Promise<unknown> {
  return JSON.parse(await readFile(new URL(`../../../contracts/fixtures/${name}`, import.meta.url), 'utf8')) as unknown;
}

test('offline pack manifest validates the fixture format and legacy byte field', () => {
  const parsed = parsePackManifest({
    id: 'L-103', version: 1, sizeBytes: 12000,
    files: [{ path: 'lesson.opus', bytes: 12000, sha256: 'a'.repeat(64) }],
  }, 'L-103');

  assert.equal(parsed.files[0]!.sizeBytes, 12000);
  assert.equal(parsed.sizeBytes, 12000);
});

test('offline pack manifest rejects mismatched ids, unsafe paths, and duplicate files', () => {
  assert.throws(() => parsePackManifest({ id: 'L-102', version: 1, sizeBytes: 1, files: [] }, 'L-103'), /different lesson/);
  assert.throws(() => parsePackManifest({ id: 'L-103', version: 1, sizeBytes: 1, files: [{ path: '../secret', bytes: 1, sha256: 'a'.repeat(64) }] }, 'L-103'), /unsafe file path/);
  assert.throws(() => parsePackManifest({ id: 'L-103', version: 1, sizeBytes: 1, files: [{ path: 'en.vtt', bytes: 1, sha256: 'a'.repeat(64) }, { path: 'en.vtt', bytes: 1, sha256: 'b'.repeat(64) }] }, 'L-103'), /more than once/);
  assert.throws(() => parsePackManifest({ id: 'L-103', version: 1, sizeBytes: 1, files: [{ path: 'en.vtt', bytes: 1, sha256: 'fixture' }] }, 'L-103'), /checksum/);
  assert.throws(() => parsePackManifest({ id: 'L-103', version: 1, sizeBytes: 2, files: [{ path: 'en.vtt', bytes: 1, sha256: 'a'.repeat(64) }] }, 'L-103'), /sum of its files/);
});

test('offline resource map only downloads files declared by the lesson and pack manifests', async () => {
  const lesson = parseLessonManifest(await fixture('v1/lessons/L-102.json'), 'L-102');
  const pack = parsePackManifest(await fixture('v1/lessons/L-102/pack.json'), 'L-102');
  const resources = buildPackResources(lesson, pack, 'http://localhost:4010', 'pk_dev_local');

  assert.ok(resources.some((item) => item.url.endsWith('/media/lesson.opus')));
  assert.ok(resources.some((item) => item.url.endsWith('/media/en.vtt')));
  assert.equal(resources.length, 3);
  assert.ok(resources.every((item) => /^[a-f0-9]{64}$/.test(item.expectedSha256)));
  assert.ok(resources.every((item) => !item.url.includes('/transcript')));
  assert.ok(resources.every((item) => item.url.startsWith('http://localhost:4010/')));
});

test('offline resource map includes declared sign and audio-description media', async () => {
  const lesson = parseLessonManifest(await fixture('v1/lessons/L-103.json'), 'L-103');
  const pack = parsePackManifest(await fixture('v1/lessons/L-103/pack.json'), 'L-103');
  const resources = buildPackResources(lesson, pack, 'http://localhost:4010', '');

  assert.equal(resources.length, 6);
  assert.ok(resources.some((item) => item.url.endsWith('/media/esl-placeholder.mp4')));
  assert.ok(resources.some((item) => item.url.endsWith('/media/ad.opus')));
  assert.ok(resources.some((item) => item.url.endsWith('/media/ad.vtt')));
  assert.ok(resources.every((item) => item.expectedBytes !== undefined && /^[a-f0-9]{64}$/.test(item.expectedSha256)));
});

test('offline resource map rejects pack files absent from the lesson contract', async () => {
  const lesson = parseLessonManifest(await fixture('v1/lessons/L-103.json'), 'L-103');
  const pack = parsePackManifest({ id: 'L-103', version: 1, sizeBytes: 1, files: [{ path: 'unknown.bin', bytes: 1, sha256: 'a'.repeat(64) }] }, 'L-103');
  assert.throws(() => buildPackResources(lesson, pack, 'http://localhost:4010', ''), /not declared in the lesson manifest/);
});

test('offline player assets are cached by original URL and downloads can resume from byte ranges', async () => {
  const src = await readFile(new URL('./offline.ts', import.meta.url), 'utf8');
  const player = await readFile(new URL('../player/savanna-player.ts', import.meta.url), 'utf8');

  assert.match(src, /Range:\s*`bytes=\$\{offset\}-\$\{end\}`/);
  assert.match(src, /chunkRequest/);
  assert.match(src, /caches\.open/);
  assert.match(src, /cache\.put\(\s*resource\.url/);
  assert.match(src, /navigator\.storage\?\.estimate/);
  assert.match(src, /aria-live="polite"/);
  assert.match(player, /getCachedObjectUrl/);
});
