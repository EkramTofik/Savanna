// Writes docs/openapi.json. Run: pnpm openapi   (then the SDK types are regenerated too)
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";

const app = await createApp({ config: loadConfig({ STORE: "memory" }) });
const out = fileURLToPath(new URL("../../../docs/openapi.json", import.meta.url));
fs.writeFileSync(out, JSON.stringify(app.locals.openapi, null, 2) + "\n");
console.log(`Wrote ${out}`);
process.exit(0);
