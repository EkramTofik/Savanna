// Builds the OpenAPI 3.1 document from the `openapi` export of every route module (task 4.4).
// Request/response shapes are written once, as Zod schemas, and converted with Zod's own JSON Schema support.
import { z } from "zod";
import type { RouteModule } from "./context";

export type Method = "get" | "post" | "put" | "patch" | "delete";

export interface ResponseDoc {
  description: string;
  /** Zod schema of the body. Omit for empty bodies (204, redirects). */
  schema?: z.ZodType;
  contentType?: string;
  /** Response headers: name -> description (for example Location on a redirect). */
  headers?: Record<string, string>;
}

export interface OperationDoc {
  method: Method;
  /** OpenAPI style path, e.g. "/lessons/{id}". Same base as your register() paths:
   *  "key" modules are relative to /v1 (we prefix it), "public" modules are written in full. */
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  /** "key" = publishable or secret key, "admin" = secret key only. Defaults to the module's access. */
  access?: "key" | "admin" | "public";
  params?: z.ZodObject; //  path parameters; keys must match the {names} in `path`
  query?: z.ZodObject;
  headers?: z.ZodObject;
  body?: z.ZodType;
  responses: Record<number, ResponseDoc>;
}

const PROBLEM_REF = { $ref: "#/components/schemas/Problem" };
const PROBLEM_TYPE = "application/problem+json";

export const ProblemSchema = z.looseObject({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
});

function js(schema: z.ZodType, io: "input" | "output"): Record<string, unknown> {
  const out = z.toJSONSchema(schema, { io, unrepresentable: "any" }) as Record<string, unknown>;
  delete out.$schema;
  return out;
}

const isOptional = (s: z.ZodType) => s.safeParse(undefined).success;

function parametersOf(where: "path" | "query" | "header", shape: z.ZodObject | undefined) {
  if (!shape) return [];
  return Object.entries(shape.shape).map(([name, field]) => {
    const schema = js(field as z.ZodType, "input");
    const description = typeof schema.description === "string" ? schema.description : undefined;
    return {
      name,
      in: where,
      required: where === "path" ? true : !isOptional(field as z.ZodType),
      ...(description ? { description } : {}),
      schema,
    };
  });
}

function problem(description: string) {
  return { description, content: { [PROBLEM_TYPE]: { schema: PROBLEM_REF } } };
}

function pascal(s: string) {
  return s.replace(/[{}]/g, "").split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");
}

export function buildOpenApi(modules: { file: string; mod: RouteModule }[]) {
  const paths: Record<string, Record<string, unknown>> = {};
  const seen = new Set<string>();

  for (const { file, mod } of modules) {
    const moduleAccess = mod.access === "public" ? "public" : "key";
    for (const op of mod.openapi ?? []) {
      const access = op.access ?? moduleAccess;
      const fullPath = moduleAccess === "public" ? op.path : `/v1${op.path}`;
      const where = `${file}: ${op.method.toUpperCase()} ${fullPath}`;

      // Catch typos early: path {names} must match the params schema.
      const inPath = [...op.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
      const declared = Object.keys(op.params?.shape ?? {}).sort();
      if (inPath.join() !== declared.join()) {
        throw new Error(`OpenAPI docs mismatch in ${where}: path has {${inPath}} but params declares {${declared}}.`);
      }
      const dupKey = `${op.method} ${fullPath}`;
      if (seen.has(dupKey)) throw new Error(`OpenAPI docs duplicate operation: ${where}`);
      seen.add(dupKey);

      const responses: Record<string, unknown> = {};
      for (const [status, r] of Object.entries(op.responses)) {
        const content = r.schema ? { [r.contentType ?? "application/json"]: { schema: js(r.schema, "output") } } : undefined;
        const headers = r.headers
          ? Object.fromEntries(Object.entries(r.headers).map(([n, d]) => [n, { description: d, schema: { type: "string" } }]))
          : undefined;
        responses[status] = { description: r.description, ...(content ? { content } : {}), ...(headers ? { headers } : {}) };
      }
      const add = (status: number, description: string) => {
        if (!responses[status]) responses[status] = problem(description);
      };
      if (op.body || op.query || op.headers) add(400, "The request did not match the expected shape.");
      if (access !== "public") {
        add(401, "Missing or invalid X-Savanna-Key.");
        add(403, access === "admin" ? "This action needs the secret key." : "This key is not allowed from this origin.");
      }
      add(429, "Too many requests.");

      const parameters = [
        ...parametersOf("path", op.params),
        ...parametersOf("query", op.query),
        ...parametersOf("header", op.headers),
      ];

      (paths[fullPath] ??= {})[op.method] = {
        operationId: op.operationId ?? `${op.method}${pascal(fullPath)}`,
        summary: op.summary,
        ...(op.description ? { description: op.description } : {}),
        tags: op.tags ?? [],
        ...(parameters.length ? { parameters } : {}),
        ...(op.body ? { requestBody: { required: true, content: { "application/json": { schema: js(op.body, "input") } } } } : {}),
        responses,
        security: access === "public" ? [] : [{ ApiKey: [] }],
      };
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Savanna Access Kit API",
      version: "1.0.0",
      description:
        "Level 2 integration (REST) for the Savanna Access Kit: accessible lessons, captions, transcripts, offline packs, " +
        "jobs and verifiable credentials. Browser components send a publishable key (`pk_...`); server-to-server calls " +
        "use the secret key. Errors are `application/problem+json` (RFC 9457).",
    },
    servers: [{ url: "/" }],
    paths,
    components: {
      securitySchemes: {
        ApiKey: { type: "apiKey", in: "header", name: "X-Savanna-Key", description: "Publishable key (read) or secret key (admin)." },
      },
      schemas: { Problem: js(ProblemSchema, "output") },
    },
  };
}
