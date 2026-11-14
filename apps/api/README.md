# @savanna/api

Express 5 + TypeScript + Zod. Owner: Member 4 (`src/app.ts`, `src/middleware`, `src/lib`, `src/config.ts`).

```bash
pnpm install
pnpm dev:api        # http://localhost:4000  (watch mode)
pnpm --filter @savanna/api test
```

Try it:
```bash
curl http://localhost:4000/v1/health
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4000/v1/whoami
```

## Adding a route (no edits to the skeleton)
Create `src/routes/<name>.ts`:
```ts
import type { Router } from "express";
import type { Ctx } from "../lib/context";
import { requireScope } from "../middleware/auth";   // optional

export function register(router: Router, ctx: Ctx) {
  router.get("/jobs/:id", (req, res) => res.json({ id: req.params.id }));          // GET /v1/jobs/:id
  router.post("/credentials", requireScope("admin"), (req, res) => res.json({})); // secret key only
}
// export const access = "public";  // mount at root, no key, use full paths
```
Validate input with Zod and just `.parse()` it; failures become a 400 problem+json automatically.
Errors: `throw new HttpError(404, "Not Found", "No such job")`.

## Endpoints (all under `/v1`, key required unless noted)
| Endpoint | Returns |
|---|---|
| `GET /health` (no key) | `{ status: "ok" }` |
| `GET /lessons` | `{ lessons: [{ id, title, durationSec }] }` |
| `GET /lessons/:id` | the lesson manifest (contract C1) |
| `GET /lessons/:id/captions/en.vtt` or `am.vtt` | 302 redirect to the caption file |
| `GET /lessons/:id/transcript?lang=en\|am` | `{ id, lang, lines: [{ start, end, text }] }` |
| `GET /preferences`, `PUT /preferences` | the preferences object (contract C3). Needs header `X-Savanna-User`: an opaque 16+ character id issued by the host platform. Only its SHA-256 hash is stored |

## Data store
`STORE=memory` (default in dev): lessons come from `contracts/fixtures`, nothing to install; preferences are lost on restart.
`STORE=prisma` (default in production): PostgreSQL. Not needed to develop other parts.
```powershell
docker compose up -d db
$env:DATABASE_URL="postgresql://savanna:savanna@localhost:5432/savanna"
pnpm --filter @savanna/api db:generate
pnpm --filter @savanna/api db:push
pnpm --filter @savanna/api db:seed      # loads the same fixtures
$env:STORE="prisma"; pnpm dev:api
```
Schema files live in `prisma/schema/` (`base.prisma`, `content.prisma`; Member 3 adds `career.prisma`).
The API output and the fixtures are both checked against one Zod schema (`src/schemas/lesson.ts`), so the real API cannot drift from the mock.

## Keys and config (env)
| Variable | Meaning | Dev default |
|---|---|---|
| `PARTNERS` | JSON array of `{name, key, origins[]}` publishable keys | key `pk_dev_local`, localhost origins |
| `SECRET_KEY` | admin key (server to server) | `sk_dev_local_change_me_please` |
| `STORE` | `memory` or `prisma` | `memory` (`prisma` in production) |
| `RATE_LIMIT_PER_MIN` | per key (or IP) | 120 |
| `NODE_ENV=production` | requires `SECRET_KEY` and `PARTNERS`, strict origins | |

Never put the secret key in browser code.
