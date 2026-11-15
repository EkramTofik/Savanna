// Fills PostgreSQL from contracts/fixtures (same data the mock server and the memory store use).
//   pnpm --filter @savanna/api db:generate && pnpm --filter @savanna/api db:push && pnpm --filter @savanna/api db:seed
import { PrismaClient } from "@prisma/client";
import { loadSeedData } from "../src/db/seedData";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL ?? "postgresql://savanna:savanna@localhost:5432/savanna" });
const { lessons, transcripts } = loadSeedData();

for (const l of lessons) {
  await prisma.lesson.upsert({
    where: { id: l.id },
    create: { id: l.id, title: l.title, durationSec: l.durationSec },
    update: { title: l.title, durationSec: l.durationSec },
  });
  await prisma.lessonAsset.deleteMany({ where: { lessonId: l.id } });
  await prisma.lessonAsset.createMany({ data: l.assets.map((a) => ({ ...a, lessonId: l.id, meta: a.meta ?? undefined })) });
}
for (const t of transcripts) {
  await prisma.transcript.upsert({
    where: { lessonId_lang: { lessonId: t.id, lang: t.lang } },
    create: { lessonId: t.id, lang: t.lang, lines: t.lines },
    update: { lines: t.lines },
  });
}
console.log(`Seeded ${lessons.length} lessons and ${transcripts.length} transcripts.`);
await prisma.$disconnect();
