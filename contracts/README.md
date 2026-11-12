# Contracts (frozen after Hour 0: additive changes only, announce in chat)

- C1 Lesson manifest: `fixtures/v1/lessons/L-102.json` (minimal: `sign`, `audioDescription` are `null`)
  and `L-103.json` (full: sign, audio description, pack). Components must cope with `null`.
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
  and serves `GET /media/<file>` from `fixtures/media/` (placeholder video, audio, captions, sign video, AD).
  Not mocked: POST requests and non-JSON API responses (`.vtt`, `.jsonld`, `pack.zip`). Use `/media/*` or your own fixtures.
- C7 Route modules: each file in `apps/api/src/routes/` exports `register(router: Router, ctx: Ctx)` plus its OpenAPI
  definitions. `Ctx = { prisma, config }`, defined in `apps/api/src/lib/context.ts`.
- C8 Fixtures: M4 L-102, transcript, preferences; M1 captions (`media/en.vtt`, `media/am.vtt`) and the lesson video;
  M2 L-103, sign, AD, pack; M3 jobs/credentials. Replace placeholders with real files anytime; keep the file names.
