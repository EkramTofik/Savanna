import * as esbuild from 'esbuild';

// Build all three Member 2 components into standalone JS bundles
await esbuild.build({
  entryPoints: {
    'sign-window': 'module/src/sign-window/sign-window.ts',
    'audio-description': 'module/src/audio-description/audio-description.ts',
    'offline': 'module/src/offline/offline.ts'
  },
  bundle: true,
  format: 'esm',
  outdir: 'module/dist',
  external: ['lit'],
  target: 'es2022',
  minify: false,
  sourcemap: true
});

console.log('✅ Components built to module/dist/');
