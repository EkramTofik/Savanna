// Contract C7: every route module receives this as its second argument.
import type { Router } from "express";

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl?: string;
}

// Replace `unknown` with the generated PrismaClient type once Prisma is set up (task 4.3).
export interface Ctx {
  prisma: unknown;
  config: AppConfig;
}

export type RegisterRoutes = (router: Router, ctx: Ctx) => void;
