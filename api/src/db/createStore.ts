import type { AppConfig, Ctx } from "../lib/context";
import { createMemoryStore } from "./memoryStore";

export async function createStore(config: AppConfig): Promise<{ store: Ctx["store"]; prisma?: unknown }> {
  if (config.store === "prisma") {
    const { createPrismaStore } = await import("./prismaStore");
    return createPrismaStore(config.databaseUrl);
  }
  return { store: createMemoryStore() };
}
