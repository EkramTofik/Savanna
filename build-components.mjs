import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

let esbuild;
try {
  esbuild = (await import("esbuild")).default;
} catch {
  const pnpmPaths = [
    "./node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js",
    "./node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js",
  ];
  for (const p of pnpmPaths) {
    if (fs.existsSync(p)) {
      esbuild = (await import(p)).default;
      break;
    }
  }
}

if (!esbuild) {
  throw new Error("Could not find esbuild.");
}

// 1. Build a small player entry point and separate optional feature chunks.
const unifiedBuild = await esbuild.build({
  entryPoints: { "savanna-access.v1": "module/src/index.ts" },
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: "dist",
  entryNames: "[name]",
  chunkNames: "chunks/[name]-[hash]",
  target: "es2022",
  minify: true,
  sourcemap: true,
  metafile: true,
});
console.log("✅ Split browser bundle built in dist/");

// Copy only the emitted browser bundle assets, retaining relative chunk paths.
fs.mkdirSync("savanna/module", { recursive: true });
const bundleAssets = [];
for (const outputName of Object.keys(unifiedBuild.metafile.outputs)) {
  if (!outputName.endsWith(".js")) continue;
  const source = path.resolve(outputName);
  const relative = path.relative(path.resolve("dist"), source);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unexpected bundle output path: ${outputName}`);
  }
  const destination = path.join("savanna/module", relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  bundleAssets.push(relative.replaceAll(path.sep, "/"));

  const mapSource = `${source}.map`;
  if (fs.existsSync(mapSource)) {
    fs.copyFileSync(mapSource, `${destination}.map`);
    bundleAssets.push(`${relative.replaceAll(path.sep, "/")}.map`);
  }
}
fs.writeFileSync(
  "savanna/module/savanna-access.v1.assets.json",
  `${JSON.stringify({ entry: "savanna-access.v1.js", files: bundleAssets }, null, 2)}\n`,
);
fs.writeFileSync("dist/savanna-access.v1.meta.json", `${JSON.stringify(unifiedBuild.metafile, null, 2)}\n`);
console.log(`✅ Copied ${bundleAssets.length} bundle assets to savanna/module/`);

// 2b. Serve the lesson cache worker at the application root so it can control the Savanna page.
fs.copyFileSync("module/src/offline/media-sw.js", "media-sw.js");
fs.copyFileSync("module/src/offline/media-sw.js", "dist/media-sw.js");
console.log("✅ Copied offline worker to media-sw.js");

// The Career Gateway is shipped by the starter page too, so produce its bundle
// as part of the same release build.
const careerRoot = path.resolve("demo/sandbox-career");
execFileSync(process.execPath, [path.join(careerRoot, "node_modules/vite/bin/vite.js"), "build"], {
  cwd: careerRoot,
  stdio: "inherit",
});
fs.copyFileSync(path.join(careerRoot, "dist/savanna-career.v1.js"), "savanna/module/savanna-career.v1.js");
console.log("✅ Built and copied Career Gateway bundle to savanna/module/");

// 3. Build modular standalone components in module/dist/
await esbuild.build({
  entryPoints: {
    "sign-window": "module/src/sign-window/sign-window.ts",
    "audio-description": "module/src/audio-description/audio-description.ts",
    offline: "module/src/offline/offline.ts",
    player: "module/src/player/savanna-player.ts",
    "job-card": "module/src/job-card/job-card.ts",
    credential: "module/src/credential/credential.ts",
  },
  bundle: true,
  format: "esm",
  outdir: "module/dist",
  target: "es2022",
  minify: false,
  sourcemap: true,
});
console.log("✅ Modular components built to module/dist/");
