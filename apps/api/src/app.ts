import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import { loadConfig } from "./config";
import type { AppConfig, Ctx } from "./lib/context";
import { loadRouteModules } from "./lib/loadRoutes";
import { authenticate, originAllowed } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/errors";
import { limiter } from "./middleware/rateLimit";

const here = path.dirname(fileURLToPath(import.meta.url));

export interface AppOptions {
  config?: AppConfig;
  /** Folder to load route modules from. Defaults to src/routes. */
  routesDir?: string;
  /** Extra context (for example a PrismaClient once task 4.3 lands). */
  ctx?: Partial<Ctx>;
}

export async function createApp(opts: AppOptions = {}) {
  const config = opts.config ?? loadConfig();
  const ctx: Ctx = { prisma: undefined, config, ...opts.ctx };

  const app = express();
  app.disable("x-powered-by");
  if (config.production) app.set("trust proxy", 1);

  const allOrigins = config.partners.flatMap((p) => p.origins);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || originAllowed(origin, allOrigins, config.production)),
      allowedHeaders: ["Content-Type", "X-Savanna-Key"],
      maxAge: 600,
    }),
  );
  app.use(limiter(config));
  app.use(express.json({ limit: "100kb" }));

  const modules = await loadRouteModules(opts.routesDir ?? path.join(here, "routes"));

  // Public modules first (full paths, no auth), then key-protected modules under /v1.
  for (const { mod } of modules.filter((m) => m.mod.access === "public")) {
    const router = Router();
    mod.register(router, ctx);
    app.use(router);
  }
  const v1 = Router();
  for (const { mod } of modules.filter((m) => m.mod.access !== "public")) {
    mod.register(v1, ctx);
  }
  app.use("/v1", authenticate(config), v1);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
