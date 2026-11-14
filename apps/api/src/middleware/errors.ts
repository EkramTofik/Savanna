import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError, sendProblem } from "../lib/errors";

export const notFound: RequestHandler = (req, res) => {
  sendProblem(res, 404, "Not Found", `No route for ${req.method} ${req.path}.`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return sendProblem(res, err.status, err.title, err.detail, err.extra);
  if (err instanceof ZodError) {
    return sendProblem(res, 400, "Invalid request", "The request did not match the expected shape.", {
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err?.type === "entity.parse.failed") return sendProblem(res, 400, "Invalid JSON", "The request body is not valid JSON.");
  if (err?.type === "entity.too.large") return sendProblem(res, 413, "Payload Too Large");
  console.error(err);
  sendProblem(res, 500, "Internal Server Error");
};
