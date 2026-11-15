// In-memory webhook registry for the Level 2 integration demo (career events).
// Files starting with "_" are skipped by the route loader, so this is a plain helper module.
import { randomBytes } from "node:crypto";

export interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  secret: string;
}

const registry = new Map<string, WebhookRegistration>();

export function addWebhook(url: string, events?: string[]): WebhookRegistration {
  const registration: WebhookRegistration = {
    id: randomBytes(8).toString("hex"),
    url,
    events: events && events.length > 0 ? events : ["*"],
    secret: randomBytes(16).toString("hex"),
  };
  registry.set(registration.id, registration);
  return registration;
}

export function listWebhooks(): WebhookRegistration[] {
  return [...registry.values()];
}

export function removeWebhook(id: string): boolean {
  return registry.delete(id);
}

export function clearWebhooks(): void {
  registry.clear();
}

/** POSTs the event to every registration that subscribes to it. No registrations means no work. */
export async function deliverEvent(event: string, data: unknown): Promise<void> {
  const target = [...registry.values()].filter((r) => r.events.includes("*") || r.events.includes(event));
  await Promise.all(
    target.map(async (registration) => {
      try {
        await fetch(registration.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Savanna-Event": event,
            "X-Savanna-Delivery": randomBytes(8).toString("hex"),
          },
          body: JSON.stringify({ event, data }),
        });
      } catch {
        /* A partner endpoint being down must never break our own write. */
      }
    }),
  );
}
