import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "@job-card": path.resolve(__dirname, "../../packages/components/src/job-card"),
      "@credential": path.resolve(__dirname, "../../packages/components/src/credential"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/bundle.ts"),
      name: "SavannaCareer",
      fileName: () => "savanna-career.v1.js",
      formats: ["es"],
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
