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

## Keys and config (env)
| Variable | Meaning | Dev default |
|---|---|---|
| `PARTNERS` | JSON array of `{name, key, origins[]}` publishable keys | key `pk_dev_local`, localhost origins |
| `SECRET_KEY` | admin key (server to server) | `sk_dev_local_change_me_please` |
| `RATE_LIMIT_PER_MIN` | per key (or IP) | 120 |
| `NODE_ENV=production` | requires `SECRET_KEY` and `PARTNERS`, strict origins | |

Never put the secret key in browser code.
