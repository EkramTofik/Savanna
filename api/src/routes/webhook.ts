import type { Router } from "express";
import { z } from "zod";
import { requireScope } from "../middleware/auth";
import type { Ctx } from "../lib/context";
import { HttpError } from "../lib/errors";
import type { OperationDoc } from "../lib/openapi";
import { addWebhook, listWebhooks, removeWebhook } from "./_member3-webhooks.js";

const RegisterWebhookSchema = z.object({
  url: z.string().url().describe("HTTPS address the host wants us to POST to."),
  events: z
    .array(z.string().min(1))
    .optional()
    .describe("Event names to subscribe to, for example credential.issued. Defaults to every event."),
});

const WebhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  events: z.array(z.string()),
});

const WebhookListSchema = z.object({
  webhooks: z.array(WebhookSchema),
});

const IdParams = z.object({
  id: z.string().min(1).describe("Webhook registration id."),
});

export function register(router: Router, ctx: Ctx): void {
  void ctx;

  router.post("/webhooks", requireScope("admin"), (req, res) => {
    const input = RegisterWebhookSchema.parse(req.body);
    const registration = addWebhook(input.url, input.events);
    res.status(201).json({ id: registration.id, url: registration.url, events: registration.events });
  });

  router.get("/webhooks", requireScope("admin"), (_req, res) => {
    res.json({
      webhooks: listWebhooks().map(({ id, url, events }) => ({ id, url, events })),
    });
  });

  router.delete("/webhooks/:id", requireScope("admin"), (req, res) => {
    const { id } = IdParams.parse(req.params);
    const removed = removeWebhook(id);
    if (!removed) throw new HttpError(404, "Not Found", `Webhook ${id} was not found.`);
    res.status(204).end();
  });
}

export const openapi: OperationDoc[] = [
  {
    method: "post",
    path: "/webhooks",
    summary: "Register a webhook address",
    description:
      "Secret-key-only action. The host registers an address and we POST a small JSON body whenever a matching event happens.",
    tags: ["Webhooks"],
    access: "admin",
    body: RegisterWebhookSchema,
    responses: {
      201: { description: "The new registration.", schema: WebhookSchema },
    },
  },
  {
    method: "get",
    path: "/webhooks",
    summary: "List webhook registrations",
    tags: ["Webhooks"],
    access: "admin",
    responses: {
      200: { description: "Every registration.", schema: WebhookListSchema },
    },
  },
  {
    method: "delete",
    path: "/webhooks/{id}",
    summary: "Remove a webhook registration",
    tags: ["Webhooks"],
    access: "admin",
    params: IdParams,
    responses: {
      204: { description: "The registration was removed." },
      404: { description: "No registration exists with this id." },
    },
  },
];
