import { createPrivateKey } from "node:crypto";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import type { AppConfig, Partner } from "./lib/context";

const DEV_PARTNER: Partner = {
  name: "dev",
  key: "pk_dev_local",
  origins: ["http://localhost:3000", "http://localhost:4010", "http://localhost:5173", "http://localhost:5174", "http://localhost:8000", "http://localhost:8080"],
};

const DEMO_PARTNER: Partner = {
  name: "demo",
  key: "pk_demo_public",
  origins: DEV_PARTNER.origins,
};

const PartnerSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(8),
  origins: z.array(z.string().url()),
});

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(4010),
  DATABASE_URL: z.string().default("postgresql://savanna:savanna@localhost:5432/savanna"),
  REDIS_URL: z.string().optional(),
  SECRET_KEY: z.string().min(16).optional(),
  /** JSON array: [{"name":"savanna","key":"pk_live_xxx","origins":["https://savanna.example"]}] */
  PARTNERS: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(120),
  /** memory = fixtures in RAM (no database). prisma = PostgreSQL. Defaults to prisma in production. */
  STORE: z.enum(["memory", "prisma"]).optional(),
  /** Local fixture/media directory for development. Production deployments should configure this explicitly or use external asset URLs. */
  MEDIA_ROOT: z.string().min(1).optional(),
  /** Local offline pack directory; each lesson id is a subdirectory. */
  PACK_ROOT: z.string().min(1).optional(),
  /** Public API key for the hosted demo. This key is intentionally publishable. */
  PUBLIC_API_KEY: z.string().min(8).optional(),
  /** Public canonical URL; Render supplies RENDER_EXTERNAL_URL automatically. */
  PUBLIC_BASE_URL: z.string().url().optional(),
  RENDER_EXTERNAL_URL: z.string().url().optional(),
  ISSUER_PRIVATE_JWK: z.string().min(1).optional(),
  /** Directory of the static site files, for a single-origin demo deployment. */
  WEB_ROOT: z.string().min(1).optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const e = EnvSchema.parse(env);
  const production = e.NODE_ENV === "production";

  const publicBaseUrl = e.PUBLIC_BASE_URL ?? e.RENDER_EXTERNAL_URL;
  if (production && (!e.SECRET_KEY || !e.ISSUER_PRIVATE_JWK || (!e.PARTNERS && (!e.PUBLIC_API_KEY || !publicBaseUrl)))) {
    throw new Error("In production, configure SECRET_KEY, ISSUER_PRIVATE_JWK, and either PARTNERS or PUBLIC_API_KEY with a public API URL.");
  }
  if (production && publicBaseUrl) {
    const url = new URL(publicBaseUrl);
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      throw new Error("In production, PUBLIC_BASE_URL must be an HTTPS origin without a path or credentials.");
    }
  }
  if (e.ISSUER_PRIVATE_JWK) {
    try {
      const key = createPrivateKey({ key: JSON.parse(e.ISSUER_PRIVATE_JWK), format: "jwk" });
      if (key.asymmetricKeyType !== "ed25519") throw new Error();
    } catch {
      throw new Error("ISSUER_PRIVATE_JWK must be a valid server-side Ed25519 private JWK.");
    }
  }

  const partners = e.PARTNERS
    ? z.array(PartnerSchema).parse(JSON.parse(e.PARTNERS))
    : production
      ? [{ name: "demo", key: e.PUBLIC_API_KEY!, origins: [new URL(publicBaseUrl!).origin] }]
      : [DEV_PARTNER, DEMO_PARTNER];

  return {
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    redisUrl: e.REDIS_URL,
    production,
    secretKey: e.SECRET_KEY ?? "sk_dev_local_only_not_secure",
    partners,
    rateLimitPerMin: e.RATE_LIMIT_PER_MIN,
    store: e.STORE ?? (production ? "prisma" : "memory"),
    mediaRoot: e.MEDIA_ROOT ?? (!production ? fileURLToPath(new URL("../../contracts/fixtures/media", import.meta.url)) : undefined),
    packRoot: e.PACK_ROOT,
    publicBaseUrl: publicBaseUrl ?? `http://localhost:${e.PORT}`,
    issuerPrivateJwk: e.ISSUER_PRIVATE_JWK,
    webRoot: e.WEB_ROOT,
  };
}
