import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register as registerJobs } from "../../../api/src/routes/jobs.js";
import { register as registerCredentials } from "../../../api/src/routes/credentials.js";
import { register as registerVerify } from "../../../api/src/routes/verify.js";
import { openapi as jobsOpenapi } from "../../../api/src/routes/jobs.js";
import { openapi as credentialsOpenapi } from "../../../api/src/routes/credentials.js";
import { openapi as verifyOpenapi } from "../../../api/src/routes/verify.js";
import { signPayload } from "../../../api/src/routes/open-badges.js";
import { createStore } from "./store.js";
import { applyFormHtml } from "./apply-form.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const port = Number(process.env.PORT ?? 4020);
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;

// Plug-in Level 2 (deck s12): a REST API described by OpenAPI so another
// platform's engineers can integrate it. Paths come from each route module.
const openApiDoc = {
  openapi: "3.1.0",
  info: {
    title: "Savanna Career Gateway API",
    version: "1.0.0",
    description:
      "Job postings (schema.org/JobPosting), verifiable credentials (Open Badges 3.0) and hosted verification. Present a key in X-Savanna-Key.",
  },
  servers: [{ url: publicBaseUrl }],
  components: {
    securitySchemes: {
      SavannaKey: { type: "apiKey", in: "header", name: "X-Savanna-Key" },
    },
    parameters: {
      SavannaKey: {
        name: "X-Savanna-Key",
        in: "header",
        required: true,
        schema: { type: "string" },
      },
    },
  },
  paths: {
    ...jobsOpenapi.paths,
    ...credentialsOpenapi.paths,
    ...verifyOpenapi.paths,
  },
};

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Savanna-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use("/media/jobs", express.static(path.join(here, "../media/jobs")));

app.get("/v1/health", (_req, res) => {
  res.json({ ok: true, slice: "career" });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDoc);
});

app.get("/apply/:id", (req, res) => {
  res.type("html").send(applyFormHtml(req.params.id));
});

const store = await createStore();
const ctx = {
  store,
  publishableKeys: new Set(["pk_demo_local"]),
  secretKeys: new Set(["sk_demo_local"]),
  publicBaseUrl,
  issuerName: "የሳቫና ተደራሽነት ኪት",
  issuerDid: "did:web:localhost%3A4020",
  signCredential: signPayload,
};

registerJobs(app, ctx);
registerCredentials(app, ctx);
registerVerify(app, ctx);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).type("application/problem+json").json({
      type: "about:blank",
      title: "Server error",
      status: 500,
      detail: "The career API hit an unexpected error.",
    });
  },
);

app.listen(port, () => {
  console.log(`Career harness on ${publicBaseUrl}`);
  console.log(`Fixtures from ${path.join(repoRoot, "contracts/fixtures/v1")}`);
});
