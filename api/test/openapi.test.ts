import path from "node:path";
import { fileURLToPath } from "node:url";
import { Validator } from "@seriousme/openapi-schema-validator";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { CAREER_HARNESS_FILES, loadRouteModules } from "../src/lib/loadRoutes";
import { buildOpenApi } from "../src/lib/openapi";
import { createSavannaClient } from "../../sdk/src";

const here = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(here, "../src/routes");
const KEY = { "X-Savanna-Key": "pk_dev_local" };
const SECRET = { "X-Savanna-Key": "sk_dev_local_change_me_please" };
const makeApp = () => createApp({ config: loadConfig({}) });

describe("OpenAPI spec", () => {
  it("is valid OpenAPI 3.1", async () => {
    const res = await request(await makeApp()).get("/v1/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    const result = await new Validator().validate(res.body);
    expect(result.valid).toBe(true);
  });

  it("the validator really rejects a broken spec", async () => {
    const result = await new Validator().validate({ openapi: "3.1.0", info: { title: "x" }, paths: { "/a": { get: {} } } });
    expect(result.valid).toBe(false);
  });

  it("is public and lists the key-protected operations with security", async () => {
    const { body } = await request(await makeApp()).get("/v1/openapi.json");
    expect(body.paths["/v1/health"].get.security).toEqual([]);
    expect(body.paths["/v1/lessons/{id}"].get.security).toEqual([{ ApiKey: [] }]);
    expect(body.paths["/v1/lessons/{id}"].get.responses["401"]).toBeTruthy();
    expect(body.paths["/v1/preferences"].put.requestBody).toBeTruthy();
    const params = body.paths["/v1/preferences"].get.parameters;
    expect(params[0]).toMatchObject({ name: "X-Savanna-User", in: "header", required: true });
  });

  it("every route file documents its operations", async () => {
    const modules = await loadRouteModules(routesDir, { excludeFiles: CAREER_HARNESS_FILES });
    for (const { file, mod } of modules) {
      expect(Array.isArray(mod.openapi) && mod.openapi.length > 0, `${file} must export openapi`).toBe(true);
    }
  });

  it("every documented operation is a real route (docs and code cannot drift)", async () => {
    const app = await makeApp();
    const { body } = await request(app).get("/v1/openapi.json");
    for (const [p, ops] of Object.entries<Record<string, unknown>>(body.paths)) {
      for (const method of Object.keys(ops)) {
        const url = p.replace(/\{(\w+)\}/g, (_m, name) => (name === "file" ? "en.vtt" : "L-102"));
        const res = await (request(app) as any)[method](url).set(SECRET);
        const routeMissing = res.status === 404 && String(res.body?.detail ?? "").startsWith("No route for");
        expect(routeMissing, `${method.toUpperCase()} ${p} is documented but not registered`).toBe(false);
      }
    }
  });

  it("rejects docs whose path names do not match the params schema", () => {
    const bad = { register: () => {}, openapi: [{ method: "get" as const, path: "/x/{id}", summary: "x", responses: { 200: { description: "ok" } } }] };
    expect(() => buildOpenApi([{ file: "bad.ts", mod: bad }])).toThrow(/mismatch/);
    const dup = { register: () => {}, openapi: [
      { method: "get" as const, path: "/a", summary: "a", params: z.object({}), responses: { 200: { description: "ok" } } },
      { method: "get" as const, path: "/a", summary: "a again", responses: { 200: { description: "ok" } } },
    ] };
    expect(() => buildOpenApi([{ file: "dup.ts", mod: dup }])).toThrow(/duplicate/);
  });
});

describe("Swagger UI", () => {
  it("serves /docs and its assets without a key, under the default CSP", async () => {
    const app = await makeApp();
    const page = await request(app).get("/docs");
    expect(page.status).toBe(200);
    expect(page.text).toContain("swagger-ui");
    expect(page.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(page.headers["content-security-policy"]).toContain("media-src 'self' blob:");
    expect((await request(app).get("/docs/assets/swagger-ui-bundle.js")).status).toBe(200);
    expect((await request(app).get("/docs/init.js")).text).toContain("/v1/openapi.json");
  });
});

describe("TypeScript SDK (generated from the spec)", () => {
  it("talks to the real API end to end", async () => {
    const app = await makeApp();
    const server = app.listen(0);
    try {
      const { port } = server.address() as { port: number };
      const api = createSavannaClient({ baseUrl: `http://127.0.0.1:${port}`, apiKey: "pk_dev_local" });

      const list = await api.GET("/v1/lessons");
      expect(list.data?.lessons.map((l) => l.id)).toEqual(["L-102", "L-103"]);

      const lesson = await api.GET("/v1/lessons/{id}", { params: { path: { id: "L-103" } } });
      expect(lesson.data?.sign?.url).toContain("esl-placeholder.mp4");
      expect(lesson.data?.captions.map((c) => c.lang)).toEqual(["en", "am"]);

      const missing = await api.GET("/v1/lessons/{id}", { params: { path: { id: "L-999" } } });
      expect(missing.response.status).toBe(404);

      const header = { "X-Savanna-User": "sdk-test-user-1234567" };
      await api.PUT("/v1/preferences", { params: { header }, body: { captions: { size: 200 } } });
      const prefs = await api.GET("/v1/preferences", { params: { header } });
      expect(prefs.data).toEqual({ captions: { size: 200 } });
    } finally {
      server.close();
    }
  });
});
