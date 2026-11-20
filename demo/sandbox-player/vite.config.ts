import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const apiOrigin = process.env.SAVANNA_API_TEST_ORIGIN ?? "http://localhost:4010";
const mediaWorkerPath = fileURLToPath(
  new URL("../../module/src/offline/media-sw.js", import.meta.url),
);

function mediaWorkerPlugin(): Plugin {
  return {
    name: "savanna-media-worker",
    configureServer(server) {
      server.middlewares.use("/media-sw.js", (request, response, next) => {
        if (request.method !== "GET" && request.method !== "HEAD") return next();
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/javascript; charset=utf-8");
        response.setHeader("Service-Worker-Allowed", "/");
        if (request.method === "HEAD") return response.end();
        return response.end(readFileSync(mediaWorkerPath));
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "media-sw.js",
        source: readFileSync(mediaWorkerPath),
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [mediaWorkerPlugin()],
  server: {
    proxy: {
      "/v1": apiOrigin,
      "/api/v1": apiOrigin,
      "/media/": apiOrigin,
      "/docs": apiOrigin,
    },
  },
  preview: {
    proxy: {
      "/v1": apiOrigin,
      "/api/v1": apiOrigin,
      "/media/": apiOrigin,
      "/docs": apiOrigin,
    },
  },
});
