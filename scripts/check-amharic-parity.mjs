import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../module/src");
const pairs = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.name === "en.json" && path.basename(path.dirname(absolute)) === "i18n") {
      const am = path.join(path.dirname(absolute), "am.json");
      try { await fs.access(am); pairs.push({ en: absolute, am }); } catch {}
    }
  }
}
await walk(root);
if (!pairs.length) throw new Error("No English/Amharic component string pairs were found.");

let totalKeys = 0;
let totalMissing = 0;
let totalExtra = 0;
const identicalValues = [];
for (const pair of pairs) {
  const en = JSON.parse(await fs.readFile(pair.en, "utf8"));
  const am = JSON.parse(await fs.readFile(pair.am, "utf8"));
  // Leading-underscore entries are translation metadata, not user-facing strings.
  const enKeys = Object.keys(en).filter((key) => !key.startsWith("_")).sort();
  const amKeys = Object.keys(am).filter((key) => !key.startsWith("_")).sort();
  const missing = enKeys.filter((key) => !Object.hasOwn(am, key));
  const extra = amKeys.filter((key) => !Object.hasOwn(en, key));
  const shared = enKeys.filter((key) => Object.hasOwn(am, key));
  totalKeys += enKeys.length;
  totalMissing += missing.length;
  totalExtra += extra.length;
  for (const key of shared) {
    if (typeof en[key] === "string" && typeof am[key] === "string" && en[key] === am[key]) {
      identicalValues.push({ component: path.relative(root, pair.en).split(path.sep)[0], key, value: en[key] });
    }
  }
  console.log(`${path.relative(root, path.dirname(path.dirname(pair.en)))}: en=${enKeys.length}, am=${amKeys.length}, missing=${missing.length}, extra=${extra.length}`);
  for (const key of missing) console.log(`  MISSING ${key}`);
  for (const key of extra) console.log(`  EXTRA ${key}`);
}
console.log(`Total English keys=${totalKeys}; missing=${totalMissing}; extra=${totalExtra}`);
console.log(`Identical English/Amharic string values=${identicalValues.length}`);
for (const item of identicalValues) console.log(`  ${item.component}.${item.key}: ${item.value}`);
if (totalMissing || totalExtra) process.exitCode = 1;
