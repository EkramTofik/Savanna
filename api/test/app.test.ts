import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateKeyPairSync } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";

const here = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(here, "fixtures/routes");
const KEY = { "X-Savanna-Key": "pk_dev_local" };
const SECRET = { "X-Savanna-Key": "sk_dev_local_only_not_secure" };
const testIssuerPrivateJwk = JSON.stringify(
  generateKeyPairSync("ed25519").privateKey.export({ format: "jwk" }),
);

async function app(env: Record<string, string> = {}) {
  return createApp({ config: loadConfig(env), routesDir });
}

// The real src/routes folder (health, whoami)
async function realApp() {
  return createApp({ config: loadConfig({}) });
}

describe("API skeleton", () => {
  it("serves a dropped-in route with no skeleton edits", async () => {
    const res = await request(await app()).get("/v1/hello").set(KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hello: "world" });
  });

  it("rejects a missing key with problem+json", async () => {
    const res = await request(await app()).get("/v1/hello");
    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.body.title).toBe("Unauthorized");
  });

  it("rejects a wrong key", async () => {
    const res = await request(await app()).get("/v1/hello").set({ "X-Savanna-Key": "pk_nope_nope" });
    expect(res.status).toBe(401);
  });

  it("blocks a publishable key from an unknown origin (production rules)", async () => {
  const res = await request(await app({ NODE_ENV: "production", STORE: "memory", SECRET_KEY: "s".repeat(20), PARTNERS: JSON.stringify([{ name: "p", key: "pk_test_only_12345", origins: ["https://ok.example"] }]), PUBLIC_BASE_URL: "https://api.ok.example", ISSUER_PRIVATE_JWK: testIssuerPrivateJwk }))
      .get("/v1/hello").set({ "X-Savanna-Key": "pk_test_only_12345", Origin: "https://evil.example" });
    expect(res.status).toBe(403);
  });

  it("allows CORS for an allowed origin and not for others", async () => {
    const a = await realApp();
    const ok = await request(a).get("/v1/health").set("Origin", "http://localhost:5173");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    const bad = await request(a).get("/v1/health").set("Origin", "https://evil.example");
    expect(bad.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("serves public routes without a key", async () => {
    const res = await request(await realApp()).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("whoami reports the caller's scope", async () => {
    const a = await realApp();
    expect((await request(a).get("/v1/whoami").set(KEY)).body).toEqual({ scope: "read", partner: "dev" });
    expect((await request(a).get("/v1/whoami").set(SECRET)).body).toEqual({ scope: "admin", partner: null });
  });

  it("returns 404 as problem+json", async () => {
    const res = await request(await app()).get("/v1/nope").set(KEY);
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/problem+json");
  });

  it("returns 400 with field errors for invalid input (Zod)", async () => {
    const res = await request(await app()).post("/v1/echo").set(KEY).send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].path).toBe("name");
  });

  it("returns 400 for broken JSON", async () => {
    const res = await request(await app()).post("/v1/echo").set(KEY).set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.title).toBe("Invalid JSON");
  });

  it("needs the secret key for admin routes", async () => {
    const a = await app();
    expect((await request(a).post("/v1/admin-only").set(KEY)).status).toBe(403);
    expect((await request(a).post("/v1/admin-only").set(SECRET)).status).toBe(200);
  });

  it("rate limits with 429 problem+json", async () => {
    const a = await app({ RATE_LIMIT_PER_MIN: "3" });
    for (let i = 0; i < 3; i++) await request(a).get("/v1/hello").set(KEY);
    const res = await request(a).get("/v1/hello").set(KEY);
    expect(res.status).toBe(429);
    expect(res.headers["content-type"]).toContain("application/problem+json");
  });

  it("refuses to start in production without real secrets", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow();
  });
});
