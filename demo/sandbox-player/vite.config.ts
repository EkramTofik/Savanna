import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    proxy: {
      "/v1": "http://localhost:4010",
      "/api/v1": "http://localhost:4010",
      "/media": "http://localhost:4010",
      "/docs": "http://localhost:4010",
    },
  },
});
