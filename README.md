# Enkopa — Savanna Access Kit

Enkopa is an accessibility prototype for learning media and career content, built for the ALX Digital Bridge Accessibility Hackathon, Track 2. It combines reusable browser components with a small REST API and content fixtures.

## What works in this repository

- A Lit web component player with English and Amharic interface strings, timed caption tracks, a transcript panel, caption settings, and keyboard shortcuts.
- A visible language switch that changes the player interface and selects the matching caption track.
- Data saver mode that defaults on and delays the video request until the learner presses **Play**.
- A browser offline download that caches the lesson video, audio, English and Amharic VTT files, transcript, and lesson metadata. The service worker serves saved media and the Savanna lesson page when offline.
- An English and Amharic, transcript-grounded demo Q&A for a small set of questions about L-102/L-103. It runs locally in the player and declines unsupported questions.
- Express API routes, a fixture-backed memory store, optional Prisma/PostgreSQL support, and the TypeScript content pipeline.
- Career cards and credential verification components. The credential proof is a prototype and does not implement the complete RDFC-1.0 canonicalization required for interoperable W3C Data Integrity verification.

## Lesson and accessibility asset status

L-102 is a 120-second spoken excerpt about learning from short online videos and longer lectures. The media file was already two minutes long; the lesson metadata incorrectly described it as 12 seconds. The manifest and timed English transcript now agree with the media duration. L-103 points to the same clip and assets.

The fixture includes timed English and Amharic captions. The repository has no native-review record for the Amharic track, so treat it as available sample content, not as independently verified captions. The current lesson manifest has `sign: null` and `audioDescription: null`. The sign control opens a clear unavailable fallback; the audio-description control is disabled. The downloadable pack therefore does not include a sign video or audio-description track. Do not present either track as available in a live pitch.

The player’s Q&A is rule-based, not a general language model. It answers a few transcript-supported questions in either language. The Amharic strings in this repository are marked as draft translations and need native-speaker review before production use.

An Ethiopia-focused L-104 script and scene production plan is prepared in `docs/production/L-104-digital-learning-safety.md`. It is not a playable lesson: no recording, measured duration, caption timings, or asset checksums exist yet.

## Why this works for Ethiopia

The prototype targets common constraints in Ethiopian learning settings: it can defer video requests in data-saver mode, save lesson files in browser storage for later offline playback, and switch its player interface and captions between English and Amharic. Those are implementation choices, not evidence of field validation. Amharic copy still needs qualified native-speaker review, and the current lessons have no approved Ethiopian Sign Language or audio-description recordings.

## Run the Savanna demo locally

Requirements: Node.js 22 or newer, pnpm 9.15, and Docker Compose.

```bash
pnpm install
pnpm build
docker compose up --build
```

Open the embedded lesson at [http://localhost:8080/savanna/pages/concept-with-navigation.html](http://localhost:8080/savanna/pages/concept-with-navigation.html). The API and Swagger UI are at `http://localhost:4010` and `http://localhost:4010/docs`.

The demo uses the development read key `pk_dev_local`. It is only for local development. The API checks `X-Savanna-Key`; production requires a configured partner allow-list and secret key. Do not use the development key in a deployed environment.

## Learner actions

1. **Amharic captions:** use the `አማ` language button to switch the interface and captions to Amharic. Use **CC** to turn captions on or off. Caption settings provide size, colors, and position.
2. **Data saver:** the toolbar shows **Data saver: On** by default. The player does not request video bytes until Play. Switch it off to allow metadata loading before playback.
3. **Offline lesson:** use **Download offline pack** below the player and wait for completion. Keep the same lesson page open or refresh it once while online so the service worker can cache the page shell. Reopen that URL offline; the lesson video and available captions are read from this browser’s storage. Use **Delete offline copy** to remove it. Browser storage and service workers require HTTPS or localhost.
4. **Sign and audio description:** the sign control can be reached by Tab or the `S` shortcut and displays the missing-track message for this fixture. Audio description is unavailable for L-102/L-103 and cannot be enabled.
5. **Lesson questions:** use the question field below the player. English and Amharic questions about the main idea, the 4:12 figure, or the lecture comparison have supported responses; other questions receive a limitation message.

## API and architecture

The generated OpenAPI 3.1 document is published by the API at `GET /v1/openapi.json` (and `/api/v1/openapi.json`) and is also checked into [docs/openapi.json](docs/openapi.json). The interactive API reference is served at `/docs` by the same API service. A production API origin is not configured in this checkout, so these paths are relative to whichever API host is configured by the deployment owner.

- `module/`: Lit custom elements, player, captions, offline cache, sign window, audio-description component, career and credential UI.
- `api/`: Express API with Zod request/response schemas and memory or Prisma store.
- `contracts/`: lesson, caption, transcript, pack, career, and credential fixtures plus the local mock server.
- `pipeline/`: TypeScript content-pack tooling.
- `savanna/`: the embedded Savanna demonstration page.
- `.github/workflows/ci.yml`: GitHub Actions checks for lint scripts, typechecks, Playwright setup, and workspace tests.

Run the API alone with `pnpm dev:api`, or the fixture mock with `pnpm mock`. Key-protected lesson routes include:

```text
GET /v1/lessons/L-102
GET /v1/lessons/L-102/transcript?lang=en
GET /v1/lessons/L-102/pack
```

The API returns `application/problem+json` errors. Production also requires `PUBLIC_BASE_URL` (the real API HTTPS origin) and a server-only `ISSUER_PRIVATE_JWK`; the private key is not shipped to the browser. The Open Badges proof remains a prototype and is not interoperable W3C Data Integrity verification.

## Build and checks

```bash
pnpm test
pnpm --filter @savanna/api test
pnpm --filter @savanna/api typecheck
pnpm --filter @savanna/pipeline typecheck
pnpm build
```

The repository does not define a standalone lint script; CI runs `pnpm -r --if-present lint` so any workspace lint scripts are picked up when present.

## Deployment status

This checkout contains a local Docker Compose setup, not a verified production deployment configuration. No deployed frontend URL is configured in the repository, so no production address is listed here. A production deployment still needs a public HTTPS host, a partner origin allow-list and secret, production media hosting on the page’s origin (or another offline-compatible same-origin route), and the chosen persistent store configuration.
