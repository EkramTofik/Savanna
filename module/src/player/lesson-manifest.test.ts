import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLessonManifest } from './lesson-manifest.ts';

async function fixture(id: string) {
  const url = new URL(`../../../contracts/fixtures/v1/lessons/${id}.json`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8')) as unknown;
}

test('player accepts both the minimal and full contract manifests', async () => {
  const minimal = parseLessonManifest(await fixture('L-102'), 'L-102');
  const full = parseLessonManifest(await fixture('L-103'), 'L-103');

  assert.equal(minimal.sign, null);
  assert.equal(minimal.audioDescription, null);
  assert.equal(full.sign?.url, 'http://localhost:4010/media/esl-placeholder.mp4');
  assert.equal(full.audioDescription?.audioUrl, 'http://localhost:4010/media/ad.opus');
});

test('player rejects mismatched, incomplete, or unsafe manifest data', async () => {
  const valid = await fixture('L-103') as Record<string, any>;
  assert.throws(() => parseLessonManifest(valid, 'L-102'), /different lesson/);

  const unsafeMedia = structuredClone(valid);
  unsafeMedia.media.video = 'javascript:alert(1)';
  assert.throws(() => parseLessonManifest(unsafeMedia), /valid HTTP or HTTPS/);

  const invalidCaption = structuredClone(valid);
  invalidCaption.captions[0].lang = 'fr';
  assert.throws(() => parseLessonManifest(invalidCaption), /caption track/);
});
