# Contracts (freeze after Hour 0)

- C1 Lesson manifest: see `fixtures/v1/lessons/L-102.json`. `sign`, `audioDescription`, `pack` may be `null`.
- C2 Player: has `id`, property `media` (HTMLMediaElement), `<slot name="overlay">`. Events (bubbles, composed):
  `savanna:ready|play|pause|seek|timeupdate|caption-change|error`. `timeupdate` detail = `{ time, paused, rate }`.
  Children find the player with `this.closest('savanna-player')`. Captions bottom, sign window top right.
- C3 Preferences: localStorage `savanna.prefs.v1`. Namespaces: ui+captions (M1), sign+ad+offline (M2), jobs (M3).
  Change only your namespace.
- C4 Language: `lang` attribute (`en`|`am`), else `document.documentElement.lang`, else `en`.
  M1 fires `savanna:lang-change` on `window` (`detail.lang`). String keys prefixed `player.* sign.* ad.* offline.* job.* cred.*`.
- C5 Tokens: `--savanna-accent`, `--savanna-font`, `--savanna-radius`, `--savanna-focus`. Defaults live inside each shadow root.
- C6 API: endpoints per SRS section 8, errors `application/problem+json`, header `X-Savanna-Key`,
  component attributes `api` and `api-key`. Mock: `pnpm mock` maps `GET /v1/<path>` to `fixtures/v1/<path>.json`.
- C7 Route modules: each file in `apps/api/src/routes/` exports `register(router, ctx)` plus its OpenAPI definitions.
- C8 Fixtures: M4 lessons/transcript/preferences, M1 captions, M2 sign/AD/pack, M3 jobs/credentials.
