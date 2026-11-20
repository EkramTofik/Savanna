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
  const fullSource = await fixture('L-103') as Record<string, unknown>;
  fullSource.sign = {
    url: 'https://media.example.test/test-only-sign-window.mp4',
    offsetMs: -250,
    languageName: 'Test-only sign-window fixture',
  };
  fullSource.audioDescription = {
    audioUrl: 'https://media.example.test/test-only-ad.opus',
    vttUrl: 'https://media.example.test/test-only-ad.vtt',
    extended: true,
    offsetMs: 400,
  };
  const full = parseLessonManifest(fullSource, 'L-103');

  assert.equal(minimal.sign, null);
  assert.equal(minimal.audioDescription, null);
  assert.equal(full.sign?.languageName, 'Test-only sign-window fixture');
  assert.equal(full.sign?.offsetMs, -250);
  assert.equal(full.audioDescription?.audioUrl, 'https://media.example.test/test-only-ad.opus');
  assert.equal(full.audioDescription?.offsetMs, 400);
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
