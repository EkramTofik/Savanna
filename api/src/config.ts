import { z } from "zod";
import { createPrivateKey } from "node:crypto";
import type { AppConfig, Partner } from "./lib/context";

const DEV_PARTNER: Partner = {
  name: "dev",
  key: "pk_dev_local",
  origins: ["http://localhost:3000", "http://localhost:4010", "http://localhost:5173", "http://localhost:5174", "http://localhost:8000", "http://localhost:8080"],
};

const PartnerSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(8),
  origins: z.array(z.string().url()),
});

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default("postgresql://savanna:savanna@localhost:5432/savanna"),
  REDIS_URL: z.string().optional(),
  SECRET_KEY: z.string().min(16).optional(),
  /** JSON array of partner names, publishable keys, and exact allowed origins. */
  PARTNERS: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(120),
  /** memory = fixtures in RAM (no database). prisma = PostgreSQL. Defaults to prisma in production. */
  STORE: z.enum(["memory", "prisma"]).optional(),
  /** Persistent directory containing per-lesson pack.json and optional pack.zip files. */
  PACK_ROOT: z.string().min(1).optional(),
  PUBLIC_BASE_URL: z.string().url().optional(),
  ISSUER_PRIVATE_JWK: z.string().min(1).optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const e = EnvSchema.parse(env);
  const production = e.NODE_ENV === "production";

  if (production && (!e.SECRET_KEY || !e.PARTNERS || !e.PUBLIC_BASE_URL || !e.ISSUER_PRIVATE_JWK)) {
    throw new Error("In production, SECRET_KEY, PARTNERS, PUBLIC_BASE_URL, and ISSUER_PRIVATE_JWK must be set.");
  }
  if (production && e.PUBLIC_BASE_URL) {
    const publicUrl = new URL(e.PUBLIC_BASE_URL);
    if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password) {
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
    : [DEV_PARTNER];

  return {
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    redisUrl: e.REDIS_URL,
    production,
    secretKey: e.SECRET_KEY ?? "sk_dev_local_only_not_secure",
    partners,
    rateLimitPerMin: e.RATE_LIMIT_PER_MIN,
    store: e.STORE ?? (production ? "prisma" : "memory"),
    packRoot: e.PACK_ROOT,
    publicBaseUrl: e.PUBLIC_BASE_URL ?? `http://localhost:${e.PORT}`,
    issuerPrivateJwk: e.ISSUER_PRIVATE_JWK,
  };
}
