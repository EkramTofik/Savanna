import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

let esbuild;
try {
  esbuild = (await import('esbuild')).default;
} catch {
  const pnpmPaths = [
    './node_modules/.pnpm/esbuild@0.28.2/node_modules/esbuild/lib/main.js',
    './node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js'
  ];
  for (const p of pnpmPaths) {
    if (fs.existsSync(p)) {
      esbuild = (await import(p)).default;
      break;
    }
  }
}

if (!esbuild) {
  throw new Error('Could not find esbuild.');
}

// 1. Build unified bundle dist/savanna-access.v1.js
await esbuild.build({
  entryPoints: ['module/src/index.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/savanna-access.v1.js',
  target: 'es2022',
  minify: false,
  sourcemap: true,
});
console.log('✅ Unified bundle built: dist/savanna-access.v1.js');

// 2. Copy to savanna/module/ for Savanna starter host pages
fs.mkdirSync('savanna/module', { recursive: true });
fs.copyFileSync('dist/savanna-access.v1.js', 'savanna/module/savanna-access.v1.js');
if (fs.existsSync('dist/savanna-access.v1.js.map')) {
  fs.copyFileSync('dist/savanna-access.v1.js.map', 'savanna/module/savanna-access.v1.js.map');
}
console.log('✅ Copied to savanna/module/savanna-access.v1.js');

// 3. Build modular standalone components in module/dist/
await esbuild.build({
  entryPoints: {
    'sign-window': 'module/src/sign-window/sign-window.ts',
    'audio-description': 'module/src/audio-description/audio-description.ts',
    'offline': 'module/src/offline/offline.ts',
    'player': 'module/src/player/savanna-player.ts',
    'job-card': 'module/src/job-card/job-card.ts',
    'credential': 'module/src/credential/credential.ts'
  },
  bundle: true,
  format: 'esm',
  outdir: 'module/dist',
  target: 'es2022',
  minify: false,
  sourcemap: true
});
console.log('✅ Modular components built to module/dist/');

// The service worker must be served from the application origin's root to control media requests.
fs.copyFileSync('module/src/offline/media-sw.js', 'dist/media-sw.js');
console.log('✅ Offline media service worker copied to dist/media-sw.js');

// The Career Gateway is a separate component package but is shipped by the
// Savanna starter page too. Build and copy it as part of the same release step.
const careerRoot = path.resolve('demo/sandbox-career');
execFileSync(process.execPath, [path.join(careerRoot, 'node_modules/vite/bin/vite.js'), 'build'], {
  cwd: careerRoot,
  stdio: 'inherit',
});
fs.copyFileSync(
  path.join(careerRoot, 'dist/savanna-career.v1.js'),
  'savanna/module/savanna-career.v1.js',
);
console.log('✅ Built and copied Career Gateway bundle to savanna/module/');
