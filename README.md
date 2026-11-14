# Savanna Access Kit

Accessible learning media and career gateway modules for Savanna (Track 2).
Embeddable web components + REST API + content pipeline.

## Quick start
```bash
corepack enable
pnpm install
pnpm mock        # mock API on http://localhost:4010 (serves contracts/fixtures)
docker compose up -d   # Postgres + Redis (needed from the API onward)
```
Try it: http://localhost:4010/v1/lessons/L-102

## Rules (see the Task Delegation Plan)
1. Contracts in `contracts/` are frozen after Hour 0: additive changes only, announce in chat.
2. One owner per folder (`.github/CODEOWNERS`). Never edit another member's folder.
3. Build against fixtures and your own sandbox in `demo/sandbox-*`.
4. Duplicate small helpers instead of waiting. Blocked over 30 min: stub it and move on.
5. Branches: `m1/...`, `m2/...`, `m3/...`, `m4/...`. Merge when CI is green.

## Layout
- `api` Express API, `savanna` Savanna starter + script tag, `demo/sandbox-*` per-member test pages
- `module` Lit web components, `pipeline` content CLI, `sdk` generated client
- `contracts` shared shapes, fixtures and mock server, `docs` documentation
