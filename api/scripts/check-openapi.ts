import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Validator } from "@seriousme/openapi-schema-validator";
import { CAREER_HARNESS_FILES, loadRouteModules } from "../src/lib/loadRoutes";
import { buildOpenApi } from "../src/lib/openapi";

const here = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.resolve(here, "../src/routes");
const committedPath = path.resolve(here, "../../docs/openapi.json");
const committed = JSON.parse(fs.readFileSync(committedPath, "utf8")) as Parameters<
  Validator["validate"]
>[0];

const validation = await new Validator().validate(committed);
if (!validation.valid) {
  throw new Error(`docs/openapi.json is not a valid OpenAPI document: ${JSON.stringify(validation.errors)}`);
}

const modules = await loadRouteModules(routesDir, { excludeFiles: CAREER_HARNESS_FILES });
const generated = buildOpenApi(modules);
if (JSON.stringify(committed) !== JSON.stringify(generated)) {
  throw new Error("docs/openapi.json is out of date. Run `pnpm openapi:build` and commit the generated spec.");
}

console.log("OpenAPI 3.1 is valid and docs/openapi.json matches the current API routes.");
