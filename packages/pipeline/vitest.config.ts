import { defineConfig } from "vitest/config";

// Run only this package's vitest tests. src/pack/pack.test.mjs (Member 2) uses node:test and runs separately.
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
