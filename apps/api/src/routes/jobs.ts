import { Router } from "express";
import type { CareerCtx } from "./career-types.js";
import { jobToJsonLd, pathParam, problem, requirePublishable } from "./career-lib.js";

export function register(router: Router, ctx: CareerCtx): void {
  const auth = requirePublishable(ctx);

  router.get("/v1/jobs", auth, async (_req, res, next) => {
    try {
      const jobs = await ctx.store.listJobs();
      res.json({
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          employer: job.employer,
          location: job.location,
          remote: job.remote,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/v1/jobs/:id.jsonld", auth, async (req, res, next) => {
    try {
      const id = pathParam(req, "id");
      const job = await ctx.store.getJob(id);
      if (!job) {
        problem(res, 404, "Not Found", `Job ${id} was not found.`);
        return;
      }
      res.type("application/ld+json").json(jobToJsonLd(job, ctx.publicBaseUrl));
    } catch (err) {
      next(err);
    }
  });

  router.get("/v1/jobs/:id", auth, async (req, res, next) => {
    try {
      const id = pathParam(req, "id");
      const job = await ctx.store.getJob(id);
      if (!job) {
        problem(res, 404, "Not Found", `Job ${id} was not found.`);
        return;
      }
      res.json(job);
    } catch (err) {
      next(err);
    }
  });
}

export const openapi = {
  paths: {
    "/v1/jobs": {
      get: {
        summary: "List jobs",
        tags: ["Jobs"],
        parameters: [{ $ref: "#/components/parameters/SavannaKey" }],
        responses: { "200": { description: "Job list" } },
      },
    },
    "/v1/jobs/{id}": {
      get: {
        summary: "Get a job",
        tags: ["Jobs"],
        parameters: [
          { $ref: "#/components/parameters/SavannaKey" },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Job" }, "404": { description: "Missing" } },
      },
    },
    "/v1/jobs/{id}.jsonld": {
      get: {
        summary: "Job as schema.org/JobPosting JSON-LD",
        tags: ["Jobs"],
        parameters: [
          { $ref: "#/components/parameters/SavannaKey" },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "JobPosting" } },
      },
    },
  },
};
