// Typed client for the Savanna Access Kit API. Types are generated from docs/openapi.json (pnpm openapi).
import createClient from "openapi-fetch";
import type { paths } from "./schema";

export type { paths, components } from "./schema";

export interface SavannaClientOptions {
  /** e.g. "https://api.example.org" (no trailing slash) */
  baseUrl: string;
  /** Publishable key (pk_...) in browsers, secret key (sk_...) only on a server. */
  apiKey: string;
  /** Custom fetch, mainly for tests. */
  fetch?: typeof fetch;
}

export function createSavannaClient(opts: SavannaClientOptions) {
  return createClient<paths>({
    baseUrl: opts.baseUrl,
    headers: { "X-Savanna-Key": opts.apiKey },
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  });
}
