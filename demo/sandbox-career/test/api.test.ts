import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.env.CAREER_API ?? "http://localhost:4020";
let child: ChildProcess | undefined;

async function json(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("X-Savanna-Key")) headers.set("X-Savanna-Key", "pk_demo_local");
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = await res.json();
  return { res, body };
}

before(async () => {
  try {
    const health = await fetch(`${BASE}/v1/health`);
    if (health.ok) return;
  } catch {
    /* start harness */
  }
  child = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "harness/server.ts"], {
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    stdio: "inherit",
  });
  for (let i = 0; i < 40; i += 1) {
    await delay(250);
    try {
      if ((await fetch(`${BASE}/v1/health`)).ok) return;
    } catch {
      /* wait */
    }
  }
  throw new Error("Career harness did not start");
});

after(() => {
  child?.kill();
});

test("GET /v1/jobs/{id}.jsonld is a JobPosting", async () => {
  const { res, body } = await json("/v1/jobs/J-9.jsonld");
  assert.equal(res.status, 200);
  assert.equal(body["@type"], "JobPosting");
  assert.equal(body.jobLocationType, "TELECOMMUTE");
  assert.equal(body.employmentType, "FULL_TIME");
  assert.ok(String(body.description).includes("በማያ ንባብ"));
});

test("issue, fetch and revoke a credential", async () => {
  const issued = await json("/v1/credentials", {
    method: "POST",
    headers: {
      "X-Savanna-Key": "sk_demo_local",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipientRef: "urn:savanna:learner:test-revoke",
      achievement: "የሙከራ ሽልማት",
      recipientName: "የሙከራ ተማሪ",
    }),
  });
  assert.equal(issued.res.status, 201);
  const id = String(issued.body.id).split("/").pop();
  assert.ok(id && id.length >= 32);

  const fetched = await json(`/v1/credentials/${id}`, {
    headers: { Accept: "application/ld+json" },
  });
  assert.equal(fetched.body.credentialStatus.status, "valid");

  const revoked = await json(`/v1/credentials/${id}/revoke`, {
    method: "POST",
    headers: { "X-Savanna-Key": "sk_demo_local" },
  });
  assert.equal(revoked.body.status, "revoked");

  const again = await json(`/v1/credentials/${id}`, {
    headers: { Accept: "application/ld+json" },
  });
  assert.equal(again.body.credentialStatus.status, "revoked");
});

test("missing key is problem+json", async () => {
  const res = await fetch(`${BASE}/v1/jobs`);
  assert.equal(res.status, 401);
  assert.ok((res.headers.get("content-type") ?? "").includes("application/problem+json"));
});
