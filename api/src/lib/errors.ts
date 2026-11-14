import type { Response } from "express";

/** RFC 9457 problem details. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  [extra: string]: unknown;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(title);
  }
}

export function sendProblem(res: Response, status: number, title: string, detail?: string, extra = {}) {
  const body: Problem = { type: "about:blank", title, status, ...(detail ? { detail } : {}), ...extra };
  res.status(status).type("application/problem+json").json(body);
}
