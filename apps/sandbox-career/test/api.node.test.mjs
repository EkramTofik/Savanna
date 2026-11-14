import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:4020";
const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let child;

before(async () => {
  try {
    if ((await fetch(`${BASE}/v1/health`)).ok) return;
  } catch {
    /* start */
  }
  child = spawn(process.execPath, ["harness/server.mjs"], { cwd, stdio: "inherit" });
  for (let i = 0; i < 40; i += 1) {
    await delay(150);
    try {
      if ((await fetch(`${BASE}/v1/health`)).ok) return;
    } catch {
      /* wait */
    }
  }
  throw new Error("server did not start");
});

after(() => child?.kill());

test("JobPosting JSON-LD", async () => {
  const res = await fetch(`${BASE}/v1/jobs/J-9.jsonld`, {
    headers: { "X-Savanna-Key": "pk_live_demo" },
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body["@type"], "JobPosting");
  assert.equal(body.jobLocationType, "TELECOMMUTE");
  assert.match(String(body.description), /screen-reader-tested/);
});

test("issue fetch revoke", async () => {
  const issued = await fetch(`${BASE}/v1/credentials`, {
    method: "POST",
    headers: { "X-Savanna-Key": "sk_live_demo", "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientRef: "urn:savanna:learner:test-revoke",
      achievement: "Test Badge",
    }),
  });
  assert.equal(issued.status, 201);
  const badge = await issued.json();
  const id = String(badge.id).split("/").pop();
  const revoked = await fetch(`${BASE}/v1/credentials/${id}/revoke`, {
    method: "POST",
    headers: { "X-Savanna-Key": "sk_live_demo" },
  });
  assert.equal((await revoked.json()).status, "revoked");
  const again = await fetch(`${BASE}/v1/credentials/${id}`, {
    headers: { "X-Savanna-Key": "pk_live_demo", Accept: "application/ld+json" },
  });
  assert.equal((await again.json()).credentialStatus.status, "revoked");
});

test("verify page has QR alt text", async () => {
  const res = await fetch(`${BASE}/verify/C-7`);
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /QR code linking to/);
  assert.match(html, /Digital Bridge/);
});

test("credential endpoint returns a tagged PDF", async () => {
  const res = await fetch(`${BASE}/v1/credentials/C-7/pdf`, {
    headers: { "X-Savanna-Key": "pk_live_demo" },
  });
  const pdf = Buffer.from(await res.arrayBuffer()).toString("latin1");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/pdf/);
  assert.match(pdf, /^%PDF-/);
  assert.match(pdf, /\/StructTreeRoot\b/);
});

test("OpenAPI and CORS support partner integrations", async () => {
  const openapi = await fetch(`${BASE}/openapi.json`).then((res) => res.json());
  assert.equal(openapi.openapi, "3.1.0");
  const preflight = await fetch(`${BASE}/v1/jobs`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://partner.example.test",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "x-savanna-key",
    },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /X-Savanna-Key/i);
});
