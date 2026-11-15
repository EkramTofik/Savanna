import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CredentialRecord, JobRecord } from "../../../api/src/routes/career-types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const fixtures = path.join(repoRoot, "contracts/fixtures/v1");
const credFile = path.join(here, "credentials-db.json");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function createStore() {
  const amharic = await readJson<{
    jobs: Record<string, Pick<JobRecord, "title" | "employer" | "location" | "payText">>;
    credentials: Record<string, Pick<CredentialRecord, "recipientName" | "achievement">>;
  }>(path.join(repoRoot, "api/src/routes/member3-amharic.json"));
  const listed = await readJson<{ jobs: { id: string }[] }>(path.join(fixtures, "jobs.json"));
  const jobs: JobRecord[] = [];
  for (const item of listed.jobs) {
    const job = await readJson<JobRecord>(path.join(fixtures, "jobs", `${item.id}.json`));
    jobs.push({ ...job, ...amharic.jobs[job.id] });
  }
  const rawSeed = await readJson<CredentialRecord>(path.join(fixtures, "credentials", "C-7.json"));
  const seed = { ...rawSeed, ...amharic.credentials[rawSeed.id] };
  let credentials: Record<string, CredentialRecord> = { [seed.id]: seed };
  try {
    credentials = {
      ...credentials,
      ...(await readJson<Record<string, CredentialRecord>>(credFile)),
    };
  } catch {
    /* first run */
  }
  if (credentials[seed.id]) {
    credentials[seed.id] = { ...credentials[seed.id], ...amharic.credentials[seed.id] };
  }

  return {
    async listJobs() {
      return jobs;
    },
    async getJob(id: string) {
      return jobs.find((job) => job.id === id) ?? null;
    },
    async getCredential(id: string) {
      return credentials[id] ?? null;
    },
    async saveCredential(record: CredentialRecord) {
      credentials[record.id] = record;
      await mkdir(path.dirname(credFile), { recursive: true });
      await writeFile(credFile, JSON.stringify(credentials, null, 2));
      return record;
    },
  };
}
