import test from "node:test";
import assert from "node:assert/strict";
import { activeAudioDescriptionCue } from "./sync.ts";

test("audio-description text cues follow the track offset and clear during gaps", async () => {
  const cues = [
    { start: 0.25, end: 1, text: "The learner opens the course page." },
    { start: 1.5, end: 2, text: "A checklist appears." },
  ];

  assert.equal(activeAudioDescriptionCue(cues, 2.25, 2_000), "The learner opens the course page.");
  assert.equal(activeAudioDescriptionCue(cues, 3.1, 2_000), "");
  assert.equal(activeAudioDescriptionCue(cues, 3.75, 2_000), "A checklist appears.");
  assert.equal(activeAudioDescriptionCue([], 4, 0), "");

  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );
  assert.match(src, /parseWebVtt\(await response\.text\(\)\)/);
  assert.match(src, /if \(!cues\.length\) throw Error/);
  assert.match(src, /this\.status = text \|\| "No audio description at this point\."/);
});

test("audio-description exposes a player-owned D-key integration point", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  assert.match(src, /public toggle\(\)/, "The owning player must be able to invoke the AD toggle");
  assert.doesNotMatch(
    src,
    /window\.addEventListener\('keydown'/,
    "The component must not compete with Member 1's global D shortcut",
  );
});

test("audio-description stays unavailable without both media URLs and valid timed cues", async () => {
  const component = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );
  const player = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../player/savanna-player.ts", import.meta.url), "utf8"),
  );

  assert.match(component, /!this\.src\.trim\(\)\s*\|\|\s*!this\.textVtt\.trim\(\)/);
  assert.match(component, /Number\.isSafeInteger\(this\.offsetMs\)/);
  assert.match(component, /if \(!cues\.length\) throw Error/);
  assert.match(component, /this\.notifyAvailability\(false\)/);
  assert.match(component, /@error=\$\{this\.audioError\}/);
  assert.match(player, /private hasAdTrack = false/);
  assert.match(player, /savanna:ad-availability/);
});

test("audio-description supports text and audio modes", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  // Verify both modes
  assert.match(src, /["']audio["']/i, "Recorded audio mode must be supported");
  assert.match(src, /["']text["']/i, "Text description mode must be supported");
  assert.match(src, /select[\s\S]*?option/, "User must be able to switch modes");
});

test("audio-description extended mode pauses video", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  assert.match(src, /extended/, "Extended mode property must exist");
  assert.match(src, /this\.media\?.pause\(\)/, "Must pause main video in extended mode");
  assert.match(src, /checkbox/, "Checkbox to toggle extended mode");
});

test("audio-description syncs with player timeupdate", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  assert.match(src, /savanna:timeupdate/, "Must listen to timeupdate events");
  assert.match(src, /Math.abs.*\.45/, "Must sync within 450ms threshold");
  assert.match(src, /currentTime/, "Must adjust audio currentTime");
  assert.match(
    src,
    /player\?\.addEventListener\(["']savanna:timeupdate["']/,
    "Must subscribe on the C2 player; player events do not bubble to children",
  );
  assert.match(
    src,
    /player\?\.removeEventListener\(["']savanna:timeupdate["']/,
    "Must clean up the C2 listener",
  );
});

test("audio-description exposes and persists an on/off state", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  assert.match(
    src,
    /aria-pressed=\$\{String\(this\.p\.enabled\)\}/,
    "The main control must expose whether descriptions are on",
  );
  assert.match(
    src,
    /this\.p\s*=\s*\{\s*\.\.\.this\.p,\s*enabled:\s*false\s*\};\s*this\.save\(\)/,
    "Stopping must persist the disabled state",
  );
  assert.match(
    src,
    /private descriptionEnded\s*=\s*\(\)\s*=>\s*\{[\s\S]*?enabled:\s*false/,
    "Ending an AD track must disable it so player events cannot restart it",
  );
});

test("audio-description has live region status announcements", async () => {
  const src = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./audio-description.ts", import.meta.url), "utf8"),
  );

  assert.match(src, /aria-live\s*=\s*["']polite["']/, "Status region must have aria-live polite");
  assert.match(src, /role\s*=\s*["']status["']/, "Status region must have role=status");
  assert.match(src, /this\.status\s*=/, "Must update status text for screen readers");
});
