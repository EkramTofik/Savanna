# Pitch-day implementation and verification report

## Result

The repository is better prepared for review and a local demonstration, but **it is not yet ready for a hosted hackathon demonstration**. No real hosted URL, production environment, production smoke run, human Amharic approval, approved Ethiopian Sign Language video, or approved production audio description is available in the checkout. Do not present a local server as the hosted pitch demo.

## Audit summary

| Area | Before / finding | After this work | Status |
| --- | --- | --- | --- |
| Course navigation | Several course activities had no real lesson route. | Links point to the two present L-102/L-103 fixture routes; unavailable VA activities are marked unavailable. Browser history and selection are tested. | Verified locally |
| Lesson duration | Manifest metadata reported the short duration while media is two minutes. | L-102/L-103 manifest and browser media duration are 120 seconds; English and Amharic cue fixtures end at 02:00. Both lessons still share the same video. | Verified for existing fixture; no separate L-DEMO |
| L-DEMO production | No separately produced 2–3 minute lesson or media rights record. | Added source/rights handoff and retained L-104 as a script/translation draft. No video, narration master, timed L-104 captions, approved AD, or checksums were fabricated. | Incomplete; requires content production |
| Audio description | Standalone fixture assets could be mistaken for lesson media. | L-102/L-103 retain `audioDescription: null`; demo fixture assets are excluded from the production site package. Component has cue, offset, synchronization, keyboard and unavailable-media tests. | Software integration tested; production media unavailable |
| Ethiopian Sign Language | A placeholder video exists in test fixtures. | Workflow now requires human Ethiopian Sign Language interpretation and review; manifests remain `sign: null`; placeholder is not included in production site build. | Integration ready for real asset; no verified ESL clip |
| Amharic | Machine/working translation could be overclaimed. | Review checklist records UI, captions, Q&A, errors, downloads, language selection, lesson content, job/credential copy and demo surfaces. English/Amharic player key sets match 141/141. | Automated parity only; native-speaker review pending |
| OpenAPI | Spec was served and checked in, but no drift check existed in CI. | Added `openapi:build` and `openapi:check`; check validates OpenAPI 3.1 and compares `docs/openapi.json` to current API routes. API route includes JSON content type and cache headers. | Local check passed; hosted address unverified |
| Credential innovation | Issuing/signing prototype and hosted API verification exist. | Production requires an explicit Ed25519 private JWK and public issuer base URL. Career sandbox keys now clearly say `demo_local`. | Not a portable W3C VC 2.0 client verifier; RDFC/Data Integrity requirements not met |
| Offline innovation | Lesson pack and service-worker path existed, with integrity/retry work in the current diff. | Size/hash validation, retry reuse, cached range response and offline lesson replay passed local tests. | Works locally; pack is 2,128,323 bytes (~2.03 MiB), not ≤1 MiB |
| Hosting | No URL or production credentials configured. | Beginner Render guide documents static frontend, Docker API and Postgres setup, env variables, CORS, worker/media paths, seeding and smoke checks. | Guide prepared; deployment not performed |
| Accessibility | Automated cases existed in source. | Playwright executed at default and zoomed layouts, forced colors, reduced motion, keyboard controls, captions and offline behavior; six player axe analyses had zero violations. | Automated browser cases pass; no representative user testing or conformance audit |
| CI / size | Workflow missed player build/axe and OpenAPI drift checks. | Workflow now installs the player browser, runs OpenAPI check, component build, fixture API smoke test and recursive tests. | Workflow file edited but GitHub CI not run; size target still fails |

## Commands actually run and results

Commands below ran from the repository on Windows PowerShell. Local package executables were used where Corepack/pnpm was unavailable in the environment.

| Command | Result |
| --- | --- |
| `$files = @(); $files += Get-ChildItem 'pipeline/src/pack' -Filter '*.test.mjs' \| ForEach-Object { $_.FullName }; $files += Get-ChildItem 'module/src' -Recurse -Filter '*.test.ts' \| ForEach-Object { $_.FullName }; node --test $files` | **79 passed, 0 failed.** Includes course navigation, pack integrity, EN/AM Q&A, AD/sign sync and service-worker cases. |
| From `api/`: `.\node_modules\.bin\vitest.CMD run` | **57 passed across 5 files.** Includes manifest, CORS, OpenAPI, credential issue/revoke and API behavior tests. |
| From `api/`: `..\node_modules\.bin\tsc.CMD --noEmit` | **Passed.** |
| From `module/`: `.\node_modules\.bin\tsc.CMD --noEmit -p .\tsconfig.json` | **Passed.** |
| `node build-components.mjs` | **Passed.** Built `dist/savanna-access.v1.js`, copied the bundle, service worker and module components. |
| `node -e "const fs=require('node:fs'),z=require('node:zlib');const b=fs.readFileSync('savanna/module/savanna-access.v1.js');console.log(b.length,z.gzipSync(b).length)"` | **306,851 bytes raw; 66,772 bytes gzip.** Over the requested 60 KB gzip budget. |
| From `demo/sandbox-player/`: `node node_modules/vite/bin/vite.js build` | **Passed.** Vite output: HTML 35.20 KB (7.22 KB gzip); JS 224.05 KB (55.85 KB gzip). This is the sandbox page, not a standalone offline page. |
| From `demo/sandbox-player/`: `$env:PORT='45175'; $env:SAVANNA_API_PORT='45174'; $env:SAVANNA_API_PROXY_TARGET='http://localhost:45174'; node node_modules/@playwright/test/cli.js test` | **17 passed.** Six player axe analyses reported zero violations; duration/range/captions, zoom, forced colors, reduced motion, keyboard, retries and browser-offline replay passed. |
| From `demo/sandbox-career/`: `node node_modules/vite/bin/vite.js build; node node_modules/@playwright/test/cli.js test` | **Build passed; 15 browser/API tests passed.** Includes renamed test-key flow, Amharic/English, JSON-LD, credential/revocation, CORS, axe and layout checks. |
| From `api/`: `node node_modules/tsx/dist/cli.mjs scripts/export-openapi.ts` followed by `node node_modules/tsx/dist/cli.mjs scripts/check-openapi.ts` | **Passed.** Exported the OpenAPI 3.1 copy, validated it, and confirmed it matches route-derived output. |
| `docker compose config --quiet` | **Passed.** Compose configuration parses; no Docker image build or deployment was run. |
| Local API smoke: start API with `PORT=45174 STORE=memory`; run `node scripts/smoke-test.mjs --base http://localhost:45174 --media-base http://localhost:45174` with `SAVANNA_SMOKE_ORIGIN=http://localhost:5174`, `SAVANNA_SMOKE_API_KEY=pk_dev_local`, and `SAVANNA_SMOKE_CREDENTIAL_ID=C-7` | **10 checks passed.** Health, OpenAPI, L-102 manifest/CORS, video/audio types, EN/AM VTT parsing, video ranges, offline pack manifest and credential proof fields. Health is process-level and proof-field checks do not establish DB readiness or VC cryptographic conformance. |
| Amharic key parity script (`ConvertFrom-Json -AsHashtable` comparing `module/src/player/i18n/en.json` and `am.json`) | **141 English keys / 141 Amharic keys; 0 missing, 0 extra.** This does not assess translation quality. |
| `git diff --check` | **Passed.** Git printed line-ending conversion warnings for files configured to normalize to CRLF; no whitespace errors were reported. |
| Scoped placeholder scan (`rg` documented in `docs/AUDIT-PITCH-DAY.md`) | No deployment placeholders were found in the requested paths; remaining localhost strings are local examples, dev defaults, test harnesses or tests. The audit document itself is excluded to avoid matching its scan pattern. |

L-102 and L-103 each declare 120 seconds. Their video is 2,096,006 bytes; their offline pack declares 2,128,323 bytes. EN and AM VTT final cues end at `02:00.000`. The browser test observed `video.duration` at 120 seconds and a cached range response `206 bytes 0-1023/2096006`. `ffprobe` and `ffmpeg` were unavailable, so no ffprobe duration result is claimed.

Execution notes: `corepack pnpm test` could not start because Corepack could not download pnpm from `registry.npmjs.org` (`ENOTFOUND`); the already-installed Node test runner ran the repository suites directly and passed 79/79. The initial default-sandbox API attempt had 47 loopback `EACCES` failures (10 tests passed); rerunning with local-socket access passed all 57/57. One additional initial command used the wrong working directory/CLI path and failed before exercising the target; corrected build and test commands passed. An earlier API typecheck caught a mismatch in the new OpenAPI checker; it was corrected and the final typecheck passed. No application test failure remains from the corrected commands.

The repository does not define root `lint` or root `typecheck` scripts. The available API and components TypeScript checks were run directly. No linter or size-limit checker is configured, so those acceptance checks remain unavailable rather than passed.

## Incomplete work and why

- A separate original/licensed L-DEMO was not created. The existing fixture’s source and redistribution rights are not recorded, and this environment has no confirmed recording/production pipeline or rights evidence. Reusing or stretching a fixture would misrepresent it as new production content.
- L-104 remains a 319-word English narration draft targeting 150 seconds (about 128 words per minute before pauses) with an Amharic translation draft. No recorded video/narration, timed captions, approved AD or production checksums exist.
- No genuine, human-reviewed Ethiopian Sign Language recording exists. No sign language is presented as ESL.
- Amharic automated key/timing checks pass, but semantic quality, natural phrasing and UI fit need a qualified native-speaker review. No human approval evidence exists.
- AD demo audio/VTT files are fixture-only. Production availability remains false for L-102/L-103.
- Credential proof is not full W3C VC 2.0 Data Integrity/RDFC interoperability and no client verifier locally checks a pasted/uploaded credential. The mandatory portable-verifier innovation is incomplete.
- There is no ≤50 KB lesson-specific standalone page in the offline pack, and the pack is 2.03 MiB rather than ≤1 MiB.
- The player core bundle misses the 60 KB gzip target by 6,772 bytes (about 11.3% of the target). No size-limit CI check was added because the current bundle would fail it.
- CI was not run on GitHub. There is no meaningful lint script and no coverage report establishing the requested 70% threshold.
- `build:site` and production smoke tests were not run because they require the team’s real HTTPS API origin and publishable key. Database health, persistent production storage and media hosting have not been exercised against a real host.

## Needs human or external input

1. The actual frontend/API HTTPS origins, Savanna embed origin, hosting account, production keys, managed database and domain/DNS configuration.
2. A documented license/permission record for L-102/L-103 content and media, or a newly commissioned original/licensed 120–180 second L-DEMO source/master.
3. Qualified native Amharic review and a dated approval record for UI, captions, transcript, Q&A, download/error messages, and lesson content.
4. A qualified Ethiopian Sign Language interpreter, Deaf-community review, consent, recording and measured offset for a genuine lesson clip.
5. Human AD cue approval and a recorded audio-description track with measured synchronization against the final lesson master.
6. Credential issuer DID/domain/key custody and standards work for full W3C VC 2.0 Data Integrity and client-side verification.
7. Representative learner testing and a final hosted smoke test including Savanna embedding, offline playback, and production CORS.

## Local branch and changed files

Work is on the local pitch-day-fixes branch. The exact worktree paths immediately before the local commits are shown below; there are no deleted tracked files. No push or deployment has been performed.

``text
 M .env.example
 M .github/workflows/ci.yml
 M CONFORMANCE.md
 M README.md
 M api/Dockerfile
 M api/README.md
 M api/package.json
 M api/src/app.ts
 M api/src/config.ts
 M api/src/db/store.ts
 M api/src/lib/context.ts
 M api/src/lib/manifest.ts
 M api/src/routes/_member3-career-store.ts
 M api/src/routes/career-types.ts
 M api/src/routes/lessons.ts
 M api/src/routes/open-badges.ts
 M api/src/schemas/lesson.ts
 M api/test/app.test.ts
 M api/test/content.test.ts
 M api/test/member3-career.test.ts
 M api/test/openapi.test.ts
 M build-components.mjs
 M contracts/README.md
 M contracts/fixtures/v1/lessons/L-102.json
 M contracts/fixtures/v1/lessons/L-102/pack.json
 M contracts/fixtures/v1/lessons/L-102/transcript.json
 M contracts/fixtures/v1/lessons/L-103.json
 M contracts/fixtures/v1/lessons/L-103/pack.json
 M contracts/fixtures/v1/lessons/L-103/transcript.json
 M contracts/mock/server.js
 M demo/blank.html
 M demo/sandbox-career/PLATFORM-INTEGRATION.md
 M demo/sandbox-career/README.md
 M demo/sandbox-career/WCAG-2.2-AA-CONFORMANCE.md
 M demo/sandbox-career/harness/server.mjs
 M demo/sandbox-career/harness/server.ts
 M demo/sandbox-career/index.html
 M demo/sandbox-career/partner-demo.html
 M demo/sandbox-career/test/api.node.test.mjs
 M demo/sandbox-career/test/api.test.ts
 M demo/sandbox-career/test/career.spec.ts
 M demo/sandbox-media/index.html
 M demo/sandbox-media/media/index.html
 M demo/sandbox-media/media/simple-test.html
 M demo/sandbox-media/standalone.html
 M demo/sandbox-media/test-member2.html
 M demo/sandbox-player/index.html
 M demo/sandbox-player/playwright.config.ts
 M demo/sandbox-player/src/main.ts
 M demo/sandbox-player/test/player.spec.ts
 M demo/savanna-patch.css
 M docker-compose.yml
 M docs/INTEGRATION.md
 M docs/TEST-PLAN.md
 M docs/openapi.json
 M docs/openapi.yaml
 M index.html
 M module/package.json
 M module/src/audio-description/audio-description.test.ts
 M module/src/audio-description/audio-description.ts
 M module/src/credential/README.md
 M module/src/job-card/README.md
 M module/src/member2-a11y.test.ts
 M module/src/offline/media-sw.js
 M module/src/offline/offline.test.ts
 M module/src/offline/offline.ts
 M module/src/offline/register-service-worker.ts
 M module/src/player/caption-loader.test.ts
 M module/src/player/i18n/am.json
 M module/src/player/i18n/en.json
 M module/src/player/preferences-manager.ts
 M module/src/player/savanna-player.ts
 M module/src/player/vtt-parser.ts
 M module/src/sign-window/sign-window.test.ts
 M module/src/sign-window/sign-window.ts
 M module/tsconfig.json
 M openapi.yaml
 M package.json
 M savanna/module/savanna-access.v1.js
 M savanna/module/savanna-access.v1.js.map
 M savanna/pages/concept-with-navigation.html
 M sdk/src/index.ts
?? api/scripts/check-openapi.ts
?? api/test/manifest.test.ts
?? demo/sandbox-player/vite.config.ts
?? docs/A11Y-STATEMENT.md
?? docs/AUDIT-PITCH-DAY.md
?? docs/BACKUP-RECORDING.md
?? docs/CHANGES-PITCH-DAY.md
?? docs/CONTENT-SOURCES.md
?? docs/DEPLOYMENT_CHECKLIST.md
?? docs/ESL-WORKFLOW.md
?? docs/PITCH-DAY-REPORT.md
?? docs/PITCH-DEMO.md
?? docs/PITCH-SLIDES-OUTLINE.md
?? docs/production/AMHARIC_REVIEW_CHECKLIST.md
?? docs/production/ESL_RECORDING_REQUIREMENTS.md
?? docs/production/L-104-digital-learning-safety.md
?? media-sw.js
?? module/src/audio-description/sync.ts
?? module/src/course-navigation.test.ts
?? module/src/offline/pack-assets.test.ts
?? module/src/offline/pack-assets.ts
?? module/src/player/lesson-assets.test.ts
?? module/src/player/lesson-qa.test.ts
?? module/src/player/lesson-qa.ts
?? module/src/player/preferences-manager.test.ts
?? module/src/player/vtt-parser.test.ts
?? scripts/prepare-static-site.mjs
?? scripts/smoke-test.mjs
```
