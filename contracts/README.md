# Contracts (frozen after Hour 0: additive changes only, announce in chat)

- C1 Lesson manifests: `fixtures/v1/lessons/L-102.json` and `L-103.json`. Both current fixtures have `sign` and
  `audioDescription` set to `null`; optional placeholder files in `fixtures/media/` are not published lesson tracks.
  Components must cope with `null`.
- C2 Player: has `id`, property `media` (HTMLMediaElement), `<slot name="overlay">`. Events (bubbles, composed):
  `savanna:ready|play|pause|seek|timeupdate|caption-change|error`. `timeupdate` detail = `{ time, paused, rate }`.
  **Units: `time` is in seconds; `offsetMs` is in milliseconds.**
  Children find the player with `this.closest('savanna-player')`. Captions bottom, sign window top right.
- C3 Preferences: localStorage `savanna.prefs.v1`. Namespaces: ui+captions (M1), sign+ad+offline (M2), jobs (M3).
  Change only your namespace.
- C4 Language: `lang` attribute (`en`|`am`), else `document.documentElement.lang`, else `en`.
  M1 fires `savanna:lang-change` on `window` (`detail.lang`). String keys prefixed `player.* sign.* ad.* offline.* job.* cred.*`.
- C5 Tokens: `--savanna-accent`, `--savanna-font`, `--savanna-radius`, `--savanna-focus`. Defaults live inside each shadow root.
- C6 API: endpoints per SRS section 8, errors `application/problem+json`, header `X-Savanna-Key`,
  component attributes `api` and `api-key`. Mock: `pnpm mock` maps `GET /v1/<path>` to `fixtures/v1/<path>.json`
  and serves `GET /media/<file>` from `fixtures/media/`.
  Real API extras (additive): `GET /v1/lessons`, `GET /v1/lessons/{id}/captions/{en|am}.vtt` (302 redirect), `GET|PUT /v1/preferences` with header `X-Savanna-User`.
  Not mocked: POST requests and non-JSON API responses (`.vtt`, `.jsonld`, `pack.zip`). Use `/media/*` or your own fixtures.
- C7 Route modules: each file in `api/src/routes/` exports `register(router: Router, ctx: Ctx)`
  (and later its OpenAPI definitions). `Ctx = { prisma, config }`, defined in `api/src/lib/context.ts`.
  Mounting (added in task 4.2, additive): default `access = "key"` -> your router is mounted under `/v1` behind
  `X-Savanna-Key` auth, so register paths WITHOUT `/v1` (e.g. `router.get("/jobs/:id", ...)`).
  `export const access = "public"` -> mounted at the root with no auth, so use FULL paths
  (e.g. `/verify/:id`, `/v1/health`).
  **Every route file must also export `openapi: OperationDoc[]`** (summary, Zod schemas for params/query/body/responses;
  see `api/src/routes/lessons.ts`). The spec at `/v1/openapi.json`, Swagger UI at `/docs` and the SDK are built from it.
  A test fails if a route file has no docs or documents a route that does not exist. Admin actions: `router.post("/credentials", requireScope("admin"), ...)`.
- C8 Fixtures: L-102 and L-103 share the 120-second lesson clip, timed English/Amharic VTT captions, and an English
  transcript. Pack metadata records file sizes and SHA-256 values. No sign-video or audio-description track is currently
  declared. Career and credential examples remain sample fixtures.
- `fixtures/media/ad.opus`, `ad.vtt`, and `esl-placeholder.mp4` are isolated component-test media. They are not approved
  lesson recordings, are not referenced by L-102/L-103 manifests or packs, and must never be labeled as verified audio
  description or Ethiopian Sign Language content.
