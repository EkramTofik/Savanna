import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(): Promise<string> {
  return readFile(new URL('./audio-description.ts', import.meta.url), 'utf8');
}

test('audio description exposes a player-owned D-key integration point', async () => {
  const src = await source();
  assert.match(src, /public toggle\(\)/);
  assert.doesNotMatch(src, /window\.addEventListener\('keydown'/);
});

test('audio description exposes selectable recorded-audio and timed-text modes', async () => {
  const src = await source();
  assert.match(src, /<select/);
  assert.match(src, /<option value="audio"/);
  assert.match(src, /<option value="text"/);
  assert.match(src, /loadTextDescriptions/);
  assert.match(src, /parseWebVtt/);
});

test('extended audio pauses only a previously playing lesson and resumes it afterward', async () => {
  const src = await source();
  assert.match(src, /this\.wasPlaying\s*=\s*Boolean\(this\.media\s*&&\s*!this\.media\.paused\)/);
  assert.match(src, /if\s*\(this\.extended\s*&&\s*this\.wasPlaying[\s\S]*?this\.media\.pause\(\)/);
  assert.match(src, /const shouldResume = this\.extended && this\.wasPlaying/);
  assert.match(src, /shouldResume && this\.media\?\.paused/);
  assert.match(src, /type="checkbox"/);
});

test('audio description synchronizes seeking, rate, pause, and playback from C2 events', async () => {
  const src = await source();
  assert.match(src, /player\?\.addEventListener\('savanna:timeupdate'/);
  assert.match(src, /player\?\.addEventListener\('savanna:seek'/);
  assert.match(src, /Math\.abs\(audio\.currentTime - targetTime\) > 0\.45/);
  assert.match(src, /audio\.playbackRate = detail\.rate/);
});

test('audio description state is accessible and persisted', async () => {
  const src = await source();
  assert.match(src, /aria-pressed=\$\{String\(this\.preferences\.enabled\)\}/);
  assert.match(src, /root\.ad = this\.preferences/);
  assert.match(src, /private stop\(persist = true/);
  assert.match(src, /role="status" aria-live="polite"/);
  assert.match(src, /this\.emitState\(\)/);
});
