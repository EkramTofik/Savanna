import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const metafilePath = path.resolve("dist/savanna-access.v1.meta.json");
const metafile = JSON.parse(fs.readFileSync(metafilePath, "utf8"));
const outputs = metafile.outputs;
const entry = Object.entries(outputs).find(([, details]) =>
  details.entryPoint?.replaceAll("\\", "/").endsWith("module/src/index.ts"),
);
if (!entry) throw new Error("Could not find the Savanna browser entry in the build metadata.");

const normalized = (name) => name.replaceAll("\\", "/");
const size = new Map();
for (const outputName of Object.keys(outputs)) {
  if (!outputName.endsWith(".js")) continue;
  const file = path.resolve(outputName);
  if (!fs.existsSync(file)) throw new Error(`Expected build output is missing: ${outputName}`);
  const bytes = fs.readFileSync(file);
  size.set(normalized(outputName), { raw: bytes.byteLength, gzip: gzipSync(bytes).byteLength });
}

function closure(start) {
  const found = new Set();
  const visit = (name) => {
    name = normalized(name);
    if (found.has(name)) return;
    if (!size.has(name)) throw new Error(`Missing JavaScript output in size graph: ${name}`);
    found.add(name);
    for (const imported of outputs[name]?.imports ?? []) {
      if (imported.kind === "import-statement") visit(imported.path);
    }
  };
  visit(start);
  return found;
}

function total(files) {
  return [...files].reduce((sum, file) => sum + size.get(file).gzip, 0);
}

const [entryName] = entry;
const core = closure(entryName);
const coursePagePath = "savanna/pages/concept-with-navigation.html";
const coursePage = fs.readFileSync(coursePagePath, "utf8");
const assets = new Map(Object.entries(outputs).filter(([, details]) => details.entryPoint));
const outputForSource = (suffix) => {
  const match = [...assets].find(([, details]) => normalized(details.entryPoint).endsWith(suffix));
  if (!match) throw new Error(`Could not find built entry for ${suffix}`);
  return normalized(match[0]);
};

// This is the current Savanna course page's eager graph: the player starts its
// preferences manager and the page includes the offline control. Sign and AD
// assets load only for lesson manifests that provide genuine media.
const firstLoad = new Set(core);
const preferencesOutput = [...size.keys()].find((name) => name.includes("preferences-manager-"));
const offlineOutput = [...size.keys()].find((name) => name.includes("/offline-"));
if (!preferencesOutput) throw new Error("Preferences chunk is missing from the build.");
closure(preferencesOutput).forEach((name) => firstLoad.add(name));
if (/<savanna-offline\b/i.test(coursePage)) {
  if (!offlineOutput) throw new Error("Offline chunk is missing from the build.");
  closure(offlineOutput).forEach((name) => firstLoad.add(name));
}

const optionalEntries = [
  ["Sign window (lesson has genuine sign video)", "module/src/sign-window/sign-window.ts"],
  ["Audio description (lesson has recorded track and VTT)", "module/src/audio-description/audio-description.ts"],
  ["Offline control (course page contains <savanna-offline>)", "module/src/offline/offline.ts"],
  ["Job card (page contains <savanna-job-card>)", "module/src/job-card/job-card.ts"],
  ["Credential (page contains <savanna-credential>)", "module/src/credential/credential.ts"],
  ["Transcript tools (user opens transcript/search/export)", "module/src/player/transcript-manager.ts"],
  ["Braille formatter (user requests BRF export)", "module/src/player/braille-formatter.ts"],
];

console.log(`Player core entry: ${size.get(normalized(entryName)).raw} B raw; ${size.get(normalized(entryName)).gzip} B gzip`);
console.log(`Player static first-load graph: ${total(core)} B gzip (${core.size} JavaScript files)`);
console.log(`Current course-page first-load graph: ${total(firstLoad)} B gzip (${firstLoad.size} JavaScript files; entry + preferences + page-declared offline control)`);
console.log("Optional chunks load when:");
for (const [label, source] of optionalEntries) {
  const output = outputForSource(source);
  const deferred = !firstLoad.has(output);
  console.log(`  ${deferred ? "deferred" : "eager  "} ${label}: ${total(closure(output))} B gzip including shared dependencies`);
}
const fontsInGraph = Object.keys(metafile.inputs).filter((input) => /\.(woff2?|ttf|otf)(\?|$)/i.test(input));
console.log(`Font files included in JavaScript graph: ${fontsInGraph.length}`);

const budget = 60 * 1024;
if (size.get(normalized(entryName)).gzip > budget) {
  throw new Error(`Player core exceeds the 60 KiB gzip budget (${size.get(normalized(entryName)).gzip} > ${budget}).`);
}
