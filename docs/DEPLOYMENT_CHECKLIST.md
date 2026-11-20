# Enkopa pitch-day deployment guide

**Current status: not deployed.** This repository has no configured production account, service URLs, credentials, or completed hosting smoke test. The instructions below describe a suitable path; they do not claim that a host has been created or that deployment has succeeded.

## Recommended hosting layout

Use three managed services in the same region:

1. A Render Static Site for the Savanna course page, player bundle, service worker, and L-102/L-103 media.
2. A Render Docker Web Service for the existing API image at `api/Dockerfile`.
3. Render Postgres for API records and transcripts.

This uses the current architecture without introducing an object-storage requirement for the two existing lessons. Render documents its static sites as CDN-hosted static assets, Docker web services as Dockerfile-based applications, and managed Postgres as a service with an internal connection URL for services in the same region ([Static Sites](https://render.com/docs/static-sites), [Docker](https://render.com/docs/docker), [Postgres connections](https://render.com/docs/postgresql-creating-connecting)).

The frontend and API have different host origins in this arrangement. The API's `PARTNERS` setting must allow the exact frontend origin. Lesson media and `/media-sw.js` stay on the frontend origin so the browser service worker can cache them. The API does not serve production media. The build package below includes only files referenced by the L-102/L-103 lesson manifests and deliberately omits the AD and sign test fixtures.

### Other suitable option

A small Ubuntu VPS can run the repository's Nginx, API, and Postgres containers behind a TLS reverse proxy. It can serve the page, worker, and media from one origin and Nginx supports byte-range media responses. It also makes the operator responsible for OS updates, TLS, database backups, firewall rules, and service restarts. The current `docker-compose.yml` and `nginx.conf` are local-development files, so do not use them unchanged as a public production deployment. For a pitch-day build, the managed Render layout above has fewer server tasks. Render's free web services can sleep after inactivity and its free Postgres databases expire after 30 days; select service plans based on the actual pitch schedule and retention requirement ([Render FAQ](https://render.com/docs/faq)).

## Repository findings and deployment decisions

- `api/Dockerfile` uses Node 22 and pnpm 9.15.0, generates Prisma, type-checks the API, then starts `tsx src/server.ts`. It copies `contracts/` into the image so the lesson fixture records and pack manifests are available to the API.
- In production the API requires `SECRET_KEY`, `PARTNERS`, the API's HTTPS `PUBLIC_BASE_URL`, and server-only `ISSUER_PRIVATE_JWK`; `PARTNERS` drives both key-origin checks and CORS. Configure exact HTTPS origins, with no trailing path.
- Configure `DATABASE_URL` from the Render Postgres **internal** connection URL when the API and database are in the same region. The database must be initialized and seeded; container build does not run `db:push` or `db:seed`.
- `PACK_ROOT` is optional for the current L-102/L-103 package because each pack manifest is bundled with the API image. Do not set it unless you have mounted persistent storage with `<lesson-id>/pack.json` files. `REDIS_URL` is optional.
- Production API code does not serve `/media`. The static-site build publishes the lesson media that the manifests refer to at same-origin `/media/...` paths.
- The page registers `/media-sw.js` at `/` scope. HTTPS is required outside local development. Render serves static sites over HTTPS and supports dashboard-defined headers; verify the actual service-worker response and media byte-range response before the demonstration ([Static Sites](https://render.com/docs/static-sites), [static-site headers](https://render.com/docs/static-site-headers)).
- L-102 and L-103 currently have English and Amharic caption paths, while `sign` and `audioDescription` are `null`. Their use of the same source video is disclosed in the navigation. L-104 remains a script draft and is not in the API catalog.
- Browser offline packs are stored in the learner's Cache Storage and can be cleared by the browser. They are not server-side persistent storage.

## Beginner deployment steps — Render

Use a connected Git repository and a branch containing the reviewed work. Do not publish from the unreviewed worktree or include local `.env` files. Do not publish the repository root as a static site: it contains source code and local/demo files.

### 1. Prepare and check the local checkout

From PowerShell at the repository root, use Node 22 and the pinned pnpm version:

```powershell
corepack prepare pnpm@9.15.0 --activate
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm --filter @savanna/api test
corepack pnpm --filter @savanna/api typecheck
corepack pnpm exec tsc -p module/tsconfig.json --noEmit
corepack pnpm build
```

Generate the server admin key, publishable partner key, and Ed25519 signing key locally. Copy the admin key only into the API's `SECRET_KEY`; copy the publishable key into the API partner entry and static site's build variable. Keep the Ed25519 private JWK only in the API's `ISSUER_PRIVATE_JWK`. The publishable key is included in public HTML; it is not an admin secret.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
node -e "console.log('pk_live_' + require('node:crypto').randomBytes(24).toString('hex'))"
node -e "console.log(JSON.stringify(require('node:crypto').generateKeyPairSync('ed25519').privateKey.export({format:'jwk'})))"
```

Do not put any generated key value in Git, `README.md`, or this guide. Do not put `SECRET_KEY` or `ISSUER_PRIVATE_JWK` in the frontend.

### 2. Create the managed PostgreSQL database

In the Render Dashboard:

1. Choose **New → PostgreSQL**.
2. Pick a region and use the same region for the API service.
3. Select a plan that remains available through the pitch and retains the database for the required period.
4. After creation, copy the database's **Internal Database URL** from its Connect/Info page. This value is a credential; add it only to the API service environment.

Render notes that internal URLs are for services in the same region. If you must run database setup from your computer instead of the API Shell, use the external URL and preserve its TLS query option (commonly `sslmode=require`).

### 3. Create and deploy the API service

In Render choose **New → Web Service**, connect the repository, then configure:

| Setting | Value |
| --- | --- |
| Runtime | Docker |
| Root Directory | Leave blank (repository root is the Docker build context) |
| Dockerfile Path | `api/Dockerfile` |
| Health Check Path | `/v1/health` |
| Region | Same region as Postgres |

Set these environment variables in the API service's **Environment** page:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default web-service port; the API reads this variable) |
| `STORE` | `prisma` |
| `DATABASE_URL` | Internal Database URL copied from this Render Postgres instance |
| `SECRET_KEY` | First locally generated value |
| `PARTNERS` | Temporarily `[]` until the static-site origin exists |
| `PUBLIC_BASE_URL` | The actual API HTTPS origin from the service dashboard |
| `ISSUER_PRIVATE_JWK` | A team-generated Ed25519 private JWK stored only in the API secret settings; never commit or add it to frontend build variables |
| `RATE_LIMIT_PER_MIN` | Optional; default is `120` |
| `PACK_ROOT` | Leave unset for the current bundled L-102/L-103 packs |
| `REDIS_URL` | Leave unset unless a Redis service is actually provisioned |

Deploy the API. The health endpoint can respond before the database schema exists, so a green health check alone does not prove database readiness. Do not treat this temporary `PARTNERS=[]` configuration as demo-ready; it allows no browser origin.

### 4. Initialize and seed a new, empty database

Use the API service Shell if available. The image's working directory is `/app/api`:

```sh
cd /app/api
pnpm db:push
pnpm db:seed
```

Run the seed once against the new demo database. It inserts repository fixture data, including sample career/credential records; those are examples, not real job listings or credentials. The seed deletes and recreates lesson asset rows, so do not rerun it against a database whose lesson records have been edited.

If the service Shell is unavailable, run the equivalent from the local repository using the Postgres **external** connection URL and TLS option:

```powershell
$env:DATABASE_URL = "<copy the external Render Postgres URL, including its TLS option>"
corepack pnpm --filter @savanna/api db:generate
corepack pnpm --filter @savanna/api db:push
corepack pnpm --filter @savanna/api db:seed
Remove-Item Env:DATABASE_URL
```

Use this only for the newly provisioned empty pitch database. The repository currently provides Prisma `db:push`, not a reviewed migration history. For a lasting production system, establish and review migrations before future schema changes.

### 5. Create the static site

Copy the API service's actual HTTPS origin from its Render dashboard. Do not include `/v1` or another path. In Render choose **New → Static Site**, connect the same repository and branch, then set:

| Setting | Value |
| --- | --- |
| Build Command | `corepack pnpm install --frozen-lockfile && corepack pnpm build && corepack pnpm build:site` |
| Publish Directory | `dist/site` |
| `NODE_VERSION` | `22.22.0` |
| `SAVANNA_API_BASE` | Actual HTTPS origin of the API web service |
| `SAVANNA_PUBLIC_KEY` | Second locally generated value |

The `build:site` step requires both build variables and fails if either is absent, if the API value is not an HTTPS origin, or if the source still has unexpected local API/key attributes. It copies the course page, built component, Savanna assets, patch CSS/JS, root service worker, and only the lesson media named by L-102/L-103. It excludes `ad.opus`, `ad.vtt`, and `esl-placeholder.mp4`.

After the static deploy finishes, copy the **actual** frontend origin shown in the dashboard. This is the exact origin to allow in API CORS. The static site build environment variables are public build inputs, not secrets; changing them requires a rebuild/redeploy ([Render environment variables](https://render.com/docs/configure-environment-variables), [Node version](https://render.com/docs/node-version)).

### 6. Allow the real frontend origin in the API

In the API service Environment page, replace `PARTNERS=[]` with one JSON value using the real key and exact static-site origin:

```json
[{"name":"savanna","key":"<the same publishable key used in SAVANNA_PUBLIC_KEY>","origins":["<the exact HTTPS static-site origin from the dashboard>"]}]
```

Save and redeploy the API. Add any actual Savanna host origin separately only after the partner provides it and confirms it can serve the player bundle, `/media/` tracks, and `/media-sw.js` from the embedding page's own origin. Do not invent or guess that origin.

### 7. Check the deployed API and media before opening the demo

Set local PowerShell variables from the real dashboard values (do not commit them):

```powershell
$apiOrigin = "<actual API origin from Render>"
$siteOrigin = "<actual static-site origin from Render>"
$publishableKey = "<publishable key>"
Invoke-RestMethod "$apiOrigin/v1/health"
Invoke-RestMethod "$apiOrigin/v1/lessons" -Headers @{ "X-Savanna-Key" = $publishableKey }
Invoke-RestMethod "$apiOrigin/v1/lessons/L-102" -Headers @{ "X-Savanna-Key" = $publishableKey }
Invoke-RestMethod "$apiOrigin/v1/lessons/L-103" -Headers @{ "X-Savanna-Key" = $publishableKey }
```

The health endpoint only checks that the API responds. The lesson list and manifests test the API key, partner setup, database connection, and seed. Confirm manifests still have `sign: null` and `audioDescription: null`.

### 8. Confirm static headers and service-worker path

In the browser Network panel, verify the site serves `media-sw.js` from the static-site root with a JavaScript content type and that the registration controls the `/savanna/pages/` course page. Verify `lesson.mp4` returns video content and a `Range: bytes=0-1023` request returns `206 Partial Content` with a valid `Content-Range`. Verify `.opus` is served as an audio format the target browser can play and `.vtt` as `text/vtt`. If the host returns incorrect MIME types, use its static response-header settings for `/media/*.opus` and `/media/*.vtt`; if media byte ranges do not work, do not claim reliable seeking—move media to a same-origin host/CDN that passes the range check before the pitch.

## Production smoke-test checklist

Record the date, browser/device, the real host origins, and pass/fail for every item. Do not mark an item passed until it has been performed against the deployed URLs.

Before the browser checklist, run the automated API/asset smoke test from the repository root. Set the values from the actual hosting dashboards and use a credential ID that really exists on that API:

```powershell
$apiOrigin = "<actual API HTTPS origin>"
$siteOrigin = "<actual frontend HTTPS origin>"
$env:SAVANNA_SMOKE_API_KEY = "<publishable partner key>"
$env:SAVANNA_SMOKE_CREDENTIAL_ID = "<existing demo credential ID>"
corepack pnpm smoke --base $apiOrigin --media-base $siteOrigin --origin $siteOrigin
```

The script checks the API health response, OpenAPI schema, L-102 manifest and CORS, media types and byte ranges, EN/AM VTT timing, pack manifest and credential JSON-LD proof fields. It does not validate the cryptographic proof or prove database readiness; inspect the browser and API logs and run the database/host checks below as well.

- [ ] Open the hosted root page and use its link to open the existing Savanna course page. Confirm no browser console errors and no request to localhost.
- [ ] In the course menu, open L-102 and L-103. Confirm the URL selects the lesson, browser Back/Forward restores the previous selection, and every available lesson link resolves to an existing fixture. The other 12 VA activities remain marked unavailable and are not links.
- [ ] Switch the player language from English to Amharic and back. Treat this as a functional language toggle only; it does not establish translation approval.
- [ ] Turn English and Amharic captions on. Confirm each cue appears during playback and the caption track ends at the lesson duration.
- [ ] Enable low-data mode. Confirm its pressed state and that video has no source/preload request until Play is pressed; on Play, confirm the lesson video loads and plays. This setting defers the video request; it does not select audio-only or a lower-bitrate stream, so do not describe it as a low-bitrate mode.
- [ ] Download L-102 or L-103 for offline use. Wait for the successful completion message, disable network access, reload the controlled course page, and play the saved lesson with captions. Repeat only on a browser profile where Cache Storage is not being cleared.
- [ ] Use keyboard only: Tab/Shift+Tab through lesson links and controls, Enter/Space to activate, and verify focus visibility, selected/current lesson state, captions, low-data mode, download progress, and error messages.
- [ ] Open the course page inside the actual Savanna host if it is available. Confirm its origin is in `PARTNERS`; verify same-origin media and service-worker hosting. If only the repository's Savanna template is available, report the result as a template-host demonstration, not a completed integration with an external Savanna deployment.
- [ ] Confirm the lesson controls say Ethiopian Sign Language and audio description are unavailable for L-102/L-103. The deployed media folder must not include `esl-placeholder.mp4`, `ad.opus`, or `ad.vtt`.
- [ ] Capture the actual `/v1/lessons/L-102`, `/v1/lessons/L-103`, `/v1/lessons/<id>/pack`, transcript, caption, and media responses; verify the CORS response only allows configured origins and the range/media content types checked above.

## Current media, language, and review status

- `contracts/fixtures/media/ad.opus` and `ad.vtt` are component-test/demo assets only. The L-102/L-103 manifests and packs do not reference them. They are not approved production audio description. The sandbox pages must be presented as UI/test harnesses, not playable AD demonstrations.
- `contracts/fixtures/media/esl-placeholder.mp4` is explicitly a placeholder and is excluded from the static build. No verified Ethiopian Sign Language recording is present. Keep lesson `sign` fields null until a genuine recording receives review and has a measured offset.
- L-102/L-103 Amharic text and captions pass repository integrity/schema/timing assertions, and both Q&A language paths have automated fixture checks. These checks do not assess natural phrasing, semantic accuracy, local terminology, or screen-reader comprehension. The review checklist remains pending qualified native-speaker review.
- L-104 is a 319-word English narration script planned for about 150 seconds (roughly 128 words per minute before pauses), with a working Amharic draft and un-timed AD narration cues. It has no recorded video or narration, locked duration, transcript, timed VTT captions, recorded AD, measured offsets, generated media checksums, or API/offline pack. Keep it out of the player/API until an external producer supplies those assets and checks pass.

## Deployment readiness blockers

- No account, service, actual host origin, production secret, database, or successful deployment has been provided or created in this work.
- Static-site media seeking (`206` byte ranges), live CORS, API/database requests, offline playback from the hosted origin, and external Savanna embedding remain post-deployment checks.
- Real media production and human review work remain outstanding as described above. A passing local build does not complete that work.

The project can be prepared for a pitch-day deployment using the steps above, but it is **not genuinely ready for a hosted demonstration until the owner deploys it and records passing results for the post-deployment smoke tests**. If human-approved Amharic, Ethiopian Sign Language, audio description, or L-104 playback are advertised as available, the relevant human/media work must also be completed first.
