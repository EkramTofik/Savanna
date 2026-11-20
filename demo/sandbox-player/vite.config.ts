import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(demoDir, "../../media-sw.js");
const port = Number(process.env.PORT || 5174);
const apiTarget = process.env.SAVANNA_API_PROXY_TARGET || "http://localhost:4010";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number.");
}

export default defineConfig({
  plugins: [
    {
      name: "serve-savanna-media-worker",
      configureServer(server) {
        server.middlewares.use("/media-sw.js", async (_request, response) => {
          try {
            response.setHeader("Content-Type", "text/javascript; charset=utf-8");
            response.setHeader("Service-Worker-Allowed", "/");
            response.end(await readFile(workerPath));
          } catch {
            response.statusCode = 404;
            response.end("Service worker source is missing.");
          }
        });
      },
    },
  ],
  server: {
    port,
    strictPort: true,
    proxy: {
      // Keep the demo API and media on the page origin so the service worker
      // and browser don't depend on a second local origin.
      "/v1": {
        target: apiTarget,
        changeOrigin: false,
      },
      "/api/v1": {
        target: apiTarget,
        changeOrigin: false,
      },
      // Lesson manifests use same-origin /media URLs so that the page service
      // worker can cache the same assets for offline playback. In development,
      // forward those URLs to the API's fixture-media mount.
      "/media": {
        target: apiTarget,
        changeOrigin: false,
      },
    },
  },
});
