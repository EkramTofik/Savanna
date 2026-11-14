import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { FIXTURES_DIR } from "../src/db/seedData";
import { fromManifest, toManifest } from "../src/lib/manifest";
import { LessonManifestSchema, TranscriptSchema } from "../src/schemas/lesson";

const KEY = { "X-Savanna-Key": "pk_dev_local" };
const USER_A = { "X-Savanna-User": "user-token-aaaaaaaaaaaa" };
const USER_B = { "X-Savanna-User": "user-token-bbbbbbbbbbbb" };
const readJson = (f: string) => JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), "utf8"));
const app = async () => createApp({ config: loadConfig({}) });

describe("contract C1: fixtures and API agree", () => {
  for (const id of ["L-102", "L-103"]) {
    it(`fixture ${id} satisfies the manifest schema`, () => {
      expect(LessonManifestSchema.safeParse(readJson(`${id}.json`)).success).toBe(true);
    });
    it(`fixture ${id} round-trips through the data model unchanged`, () => {
      const fixture = LessonManifestSchema.parse(readJson(`${id}.json`));
      expect(toManifest(fromManifest(fixture))).toEqual(fixture);
    });
    it(`GET /v1/lessons/${id} returns exactly the fixture`, async () => {
      const res = await request(await app()).get(`/v1/lessons/${id}`).set(KEY);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(readJson(`${id}.json`));
    });
  }
  it("transcript fixtures satisfy the transcript schema", () => {
    expect(TranscriptSchema.safeParse(readJson("L-102/transcript.json")).success).toBe(true);
  });
});

describe("lessons routes", () => {
  it("lists lessons", async () => {
    const res = await request(await app()).get("/v1/lessons").set(KEY);
    expect(res.status).toBe(200);
    expect(res.body.lessons.map((l: { id: string }) => l.id)).toEqual(["L-102", "L-103"]);
  });
  it("404s an unknown lesson as problem+json", async () => {
    const res = await request(await app()).get("/v1/lessons/L-999").set(KEY);
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toContain("application/problem+json");
  });
  it("needs an API key", async () => {
    expect((await request(await app()).get("/v1/lessons")).status).toBe(401);
  });
  it("redirects to the caption file", async () => {
    const res = await request(await app()).get("/v1/lessons/L-102/captions/am.vtt").set(KEY).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:4010/media/am.vtt");
  });
  it("404s unsupported caption names", async () => {
    const a = await app();
    expect((await request(a).get("/v1/lessons/L-102/captions/fr.vtt").set(KEY)).status).toBe(404);
    expect((await request(a).get("/v1/lessons/L-999/captions/en.vtt").set(KEY)).status).toBe(404);
  });
  it("serves the transcript (English by default)", async () => {
    const res = await request(await app()).get("/v1/lessons/L-102/transcript").set(KEY);
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe("en");
    expect(res.body.lines.length).toBeGreaterThan(0);
  });
  it("404s a missing transcript language and 400s a bad one", async () => {
    const a = await app();
    expect((await request(a).get("/v1/lessons/L-102/transcript?lang=am").set(KEY)).status).toBe(404);
    expect((await request(a).get("/v1/lessons/L-102/transcript?lang=xx").set(KEY)).status).toBe(400);
  });
});

describe("preferences routes", () => {
  it("needs a user token", async () => {
    const a = await app();
    expect((await request(a).get("/v1/preferences").set(KEY)).status).toBe(400);
    expect((await request(a).get("/v1/preferences").set(KEY).set("X-Savanna-User", "short")).status).toBe(400);
  });
  it("returns {} before anything is saved", async () => {
    const res = await request(await app()).get("/v1/preferences").set(KEY).set(USER_A);
    expect(res.body).toEqual({});
  });
  it("saves and reads back, per user", async () => {
    const a = await app();
    const prefs = { captions: { size: 150, color: "yellow" }, sign: { corner: "top-right" } };
    expect((await request(a).put("/v1/preferences").set(KEY).set(USER_A).send(prefs)).status).toBe(200);
    expect((await request(a).get("/v1/preferences").set(KEY).set(USER_A)).body).toEqual(prefs);
    expect((await request(a).get("/v1/preferences").set(KEY).set(USER_B)).body).toEqual({});
  });
  it("rejects unknown namespaces and oversized data", async () => {
    const a = await app();
    expect((await request(a).put("/v1/preferences").set(KEY).set(USER_A).send({ hacker: {} })).status).toBe(400);
    const big = { ui: { blob: "x".repeat(25_000) } };
    expect((await request(a).put("/v1/preferences").set(KEY).set(USER_A).send(big)).status).toBe(400);
  });
  it("allows the user header in CORS preflight", async () => {
    const res = await request(await app()).options("/v1/preferences").set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PUT").set("Access-Control-Request-Headers", "x-savanna-key,x-savanna-user");
    expect(res.headers["access-control-allow-headers"]).toContain("X-Savanna-User");
  });
});
