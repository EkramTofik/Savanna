import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { RouteModule } from "./context";

export const CAREER_HARNESS_FILES = [
  "career-lib.ts",
  "career-types.ts",
  "credential-pdf.ts",
  "credentials.ts",
  "jobs.ts",
  "open-badges.ts",
  "verify.ts",
] as const;

/** Finds every route module in a folder. Skips tests, .d.ts files and files starting with "_". */
export async function loadRouteModules(
  dir: string,
  options: { excludeFiles?: readonly string[] } = {},
): Promise<{ file: string; mod: RouteModule }[]> {
  const excluded = new Set(options.excludeFiles ?? []);
  const files = (await readdir(dir))
    .filter(
      (f) =>
        /\.(ts|js|mjs)$/.test(f) &&
        !f.endsWith(".d.ts") &&
        !/\.test\./.test(f) &&
        !f.startsWith("_") &&
        !excluded.has(f),
    )
    .sort();

  const out: { file: string; mod: RouteModule }[] = [];
  for (const file of files) {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(path.join(dir, file)).href)) as RouteModule;
    if (typeof mod.register !== "function") {
      throw new Error(`Route module "${file}" must export register(router, ctx).`);
    }
    out.push({ file, mod });
  }
  return out;
}
