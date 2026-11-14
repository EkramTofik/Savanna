// One-time repo restructure to the layout in the Team Technical Guide.
//   node restructure.mjs          Member 4, once, from the repo root
//   node restructure.mjs --fix    teammates, after merging main: moves stray new files and fixes their paths
// Moves folders with git (history follows), rewrites every path that points at a moved place,
// rebuilds pnpm-workspace.yaml, reinstalls (refreshes pnpm-lock.yaml) and stages everything.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FIX = process.argv.includes("--fix");
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 }).trim();
const die = (m) => { console.error("\nSTOP: " + m + "\n"); process.exit(1); };
const posix = path.posix;

if (!fs.existsSync(".git") || !fs.existsSync("pnpm-workspace.yaml")) die("Run this from the repo root (the folder with .git and pnpm-workspace.yaml).");
const dirty = git("status", "--porcelain").split("\n").filter((l) => l && !l.endsWith("restructure.mjs"));
if (dirty.length) die("You have uncommitted changes. Commit or stash them first, then run again.");
if (!FIX && (fs.existsSync("api") || fs.existsSync("module") || fs.existsSync("savanna"))) {
  die("api/, module/ or savanna/ already exists. Was this already run? If you just merged main, run: node restructure.mjs --fix");
}

const MOVES = [
  ["apps/api", "api"],
  ["packages/components", "module"],
  ["packages/pipeline", "pipeline"],
  ["packages/sdk", "sdk"],
  ["apps/demo", "savanna"],
  ["apps/sandbox-player", "demo/sandbox-player"],
  ["apps/sandbox-media", "demo/sandbox-media"],
  ["apps/sandbox-career", "demo/sandbox-career"],
];
const mapPath = (p) => {
  for (const [from, to] of MOVES) if (p === from || p.startsWith(from + "/")) return to + p.slice(from.length);
  return p;
};

// ---------- 1. node_modules would break after a move: remove them, pnpm install recreates them ----------
if (!FIX) {
  for (const dir of [".", "apps", "packages", ...MOVES.map(([from]) => from)]) {
    try { fs.rmSync(path.join(dir, "node_modules"), { recursive: true, force: true }); }
    catch (e) { die(`Could not delete ${dir}/node_modules (${e.code}). Close terminals, dev servers and editors using the repo, then run again.`); }
  }
}

// ---------- 2. rewrite paths in file contents (while files are still at their old locations) ----------
const TEXT = /\.(md|ts|mts|cts|tsx|jsx|js|mjs|cjs|json|ya?ml|html|css|txt|prisma|sql|sh|ps1|toml)$|CODEOWNERS$|\.gitignore$|\.env\.example$/;
const SKIP = (f) =>
  f.startsWith("apps/demo/") || f.startsWith("savanna/") || // the starter stays byte-for-byte unchanged
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|pnpm-workspace\.yaml)$/.test(f) ||
  f === "docs/openapi.json" || f.endsWith("schema.d.ts") || !TEXT.test(f);

const LITERALS = [
  ["apps/sandbox-", "demo/sandbox-"],
  ["apps/api", "api"],
  ["apps/demo", "savanna"],
  ["packages/components", "module"],
  ["packages/pipeline", "pipeline"],
  ["packages/sdk", "sdk"],
];
// ../../something  (relative paths that climb out of the current folder)
const REL = /(?<![\w.\/-])(\.\.(?:\/\.\.)*)(?=[\/\s"'`<>()\[\]{},;|*]|$)((?:\/[^\s"'`<>()\[\]{},;|*]*)?)/g;

const exists = (p) => ["", ".ts", ".mts", ".tsx", ".js", ".mjs", ".json", ".d.ts", "/index.ts", "/index.js"].some((x) => fs.existsSync(p + x)) ||
  (/\.m?js$/.test(p) && fs.existsSync(p.replace(/\.m?js$/, ".ts"))); // TS files are imported with a .js ending
const warnings = [];
function remapRelative(text, oldFile, newFile) {
  const oldDir = posix.dirname(oldFile), newDir = posix.dirname(newFile);
  return text.replace(REL, (token) => {
    const target = posix.normalize(posix.join(oldDir, token));
    if (target.startsWith("..")) return token;                 // points outside the repo
    const bare = target.replace(/\/$/, "") || ".";
    const newTarget = mapPath(bare);
    if (!exists(bare) && !exists(newTarget)) return token;      // not a real path (prose, spread, already broken): leave it
    let rel = posix.relative(newDir || ".", newTarget || ".") || ".";
    if (!rel.startsWith(".")) rel = "./" + rel;
    if (token.endsWith("/") && !rel.endsWith("/")) rel += "/";
    if (posix.normalize(token) === posix.normalize(rel)) return token;
    return rel;
  });
}

const files = git("ls-files").split("\n").filter(Boolean);
let rewritten = 0;
for (const f of files) {
  if (SKIP(f) || !fs.existsSync(f)) continue;
  const original = fs.readFileSync(f, "utf8");
  let s = remapRelative(original, f, mapPath(f));
  for (const [a, b] of LITERALS) s = s.split(a).join(b);
  if (s !== original) { fs.writeFileSync(f, s); rewritten++; }
}
console.log(`rewrote paths in ${rewritten} files`);

// ---------- 3. move ----------
fs.mkdirSync("demo", { recursive: true });
if (FIX) {
  let moved = 0;
  for (const [from, to] of MOVES) {
    for (const f of git("ls-files", from).split("\n").filter(Boolean)) {
      const dest = to + f.slice(from.length);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      git("mv", f, dest);
      moved++;
    }
  }
  console.log(`moved ${moved} stray files into the new folders`);
} else {
  for (const [from, to] of MOVES) {
    if (!fs.existsSync(from)) { console.log(`skip (not found): ${from}`); continue; }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    git("mv", from, to);
    console.log(`moved ${from} -> ${to}`);
  }
}
for (const d of ["apps", "packages"]) {
  try { if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmdirSync(d); } catch {}
}

// ---------- 4. workspace = every folder that has a package.json (except the root and the starter) ----------
const pkgDirs = git("ls-files", "--", "*package.json").split("\n").filter(Boolean)
  .filter((f) => f !== "package.json" && !f.startsWith("savanna/") && !f.includes("node_modules"))
  .map((f) => posix.dirname(f))
  .filter((d) => fs.existsSync(path.join(d, "package.json")) && JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8")).name);
fs.writeFileSync("pnpm-workspace.yaml", "packages:\n" + [...new Set(pkgDirs)].sort().map((d) => `  - "${d}"`).join("\n") + "\n");
console.log("workspace packages:", [...new Set(pkgDirs)].sort().join(", "));

// ---------- 5. verify: every rewritten relative path must exist ----------
for (const f of git("ls-files", "api", "module", "pipeline", "sdk", "demo", "docs", "contracts", ".github").split("\n").filter(Boolean)) {
  if (SKIP(f) || !fs.existsSync(f)) continue;
  const dir = posix.dirname(f);
  fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(REL)) {
      const t = posix.normalize(posix.join(dir, m[0]));
      if (m[0].includes("*") || t.startsWith("..") || /node_modules/.test(t)) continue;
      if (!exists(t.replace(/\/$/, ""))) warnings.push(`  ${f}:${i + 1}: ${m[0]}`);
    }
  });
}
console.log("\nCHECK these paths (they should point at something that exists, a few can be false alarms):");
console.log(warnings.length ? warnings.slice(0, 40).join("\n") : "  (none)");
if (!FIX && fs.existsSync("apps")) console.log("\nNOTE: apps/ still holds files that belong to nobody (" + fs.readdirSync("apps").join(", ") + "). Probably an accidental `npm install` in apps/. Its owner should `git rm` them.");

// ---------- 6. reinstall (refreshes pnpm-lock.yaml) and stage ----------
git("add", "-A");
try {
  console.log("\nRunning pnpm install ...");
  execFileSync("pnpm", ["install", "--no-frozen-lockfile"], { stdio: "inherit", shell: process.platform === "win32" });
  git("add", "-A");
} catch { console.log("\npnpm install failed. Run `pnpm install` yourself, then `git add -A`."); }

console.log("\nDone. Next:\n  pnpm -r --if-present typecheck\n  pnpm --filter @savanna/api test\n  pnpm --filter @savanna/pipeline test\n  git commit -m \"chore: restructure repo to match the technical guide\"\n(restructure.mjs is committed on purpose: teammates run `node restructure.mjs --fix` after merging main. Delete it later.)");
