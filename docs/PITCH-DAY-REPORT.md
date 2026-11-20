# Pitch-day implementation and verification report

## Result

The repository is better prepared for review and a local demonstration, but **it is not yet ready for a hosted hackathon demonstration**. No real hosted URL, production environment, production smoke run, human Amharic approval, approved Ethiopian Sign Language video, or approved production audio description is available in the checkout. Do not present a local server as the hosted pitch demo.

## Audit summary

| Area | Before / finding | After this work | Status |
| --- | --- | --- | --- |
| Course navigation | Several course activities had no real lesson route. | Links point to the two present L-102/L-103 fixture routes; unavailable VA activities are marked unavailable. Browser history and selection are tested. | Verified locally |
| Lesson duration | Manifest metadata reported the short duration while media is two minutes. | L-102/L-103 manifest and browser media duration are 120 seconds; English and Amharic cue fixtures end at 02:00. Both lessons still share the same video. | Verified for existing fixture; no separate L-DEMO |
| L-104 production | No separately recorded lesson or media rights record. | Added `pnpm l104:ingest --video <file>` tooling that probes duration, requires H.264 video plus embedded AAC narration, extracts mono Opus, drafts reviewed=false English cues, builds checksums/pack, and only writes the lesson manifest last. No production media was available to ingest. | Ingest implementation prepared; L-104 remains unavailable and requires real production media and caption review |
| Audio description | Standalone fixture assets could be mistaken for lesson media. | L-102/L-103 retain `audioDescription: null`; demo fixture assets are excluded from the production site package. Component has cue, offset, synchronization, keyboard and unavailable-media tests. | Software integration tested; production media unavailable |
| Ethiopian Sign Language | A placeholder video exists in test fixtures. | Workflow now requires human Ethiopian Sign Language interpretation and review; manifests remain `sign: null`; placeholder is not included in production site build. | Integration ready for real asset; no verified ESL clip |
| Amharic | Machine/working translation could be overclaimed. | Checklist covers UI, captions, Q&A, errors, downloads, language selection, lesson content, demos, and the new light page. All three component dictionaries have matching key sets (141 player, 16 job-card, 17 credential). | Automated key parity only; native-speaker review pending |
| OpenAPI | Spec was served and checked in, but no drift check existed in CI. | Added `openapi:build` and `openapi:check`; check validates OpenAPI 3.1 and compares `docs/openapi.json` to current API routes. API route includes JSON content type and cache headers. | Local check passed; hosted address unverified |
| Credential innovation | Issuing/signing prototype and hosted API verification exist. | Production requires an explicit Ed25519 private JWK and public issuer base URL. Career sandbox keys now clearly say `demo_local`. | Not a portable W3C VC 2.0 client verifier; RDFC/Data Integrity requirements not met |
| Offline innovation | Lesson pack and service-worker path existed, with integrity/retry work in the current diff. | Size/hash validation, retry reuse, cached range response and offline lesson replay passed local tests. The pack pipeline now targets 16 kbps mono Opus and generates a small inline light-page template with synchronized VTT cues. | L-102/L-103 full pack is 2,128,323 bytes (~2.03 MiB); no real ≤1 MiB low-data pack or selectable profile is integrated |
| Hosting | No URL or production credentials configured. | Beginner Render guide documents static frontend, Docker API and Postgres setup, env variables, CORS, worker/media paths, seeding and smoke checks. | Guide prepared; deployment not performed |
| Accessibility | Automated cases existed in source. | The current player Playwright suite passed 18 tests, including keyboard-only playback, captions, language switching, sign movement, unavailable AD, transcript search/seek and offline behavior. | Automated browser cases pass; no representative user testing or conformance audit |
| CI / size | Workflow missed player build/axe and OpenAPI drift checks. | Added a reproducible gzip size check and 60 KiB core budget to CI. Current player core is 29,719 bytes gzip; static graph is 37,301 bytes and the course page's measured eager first load is 43,782 bytes gzip. | Local check passed; GitHub CI has not run |

## Commands actually run and results

Commands below ran from the repository on Windows PowerShell. Local package executables were used where Corepack/pnpm was unavailable in the environment.

| Command | Result |
| --- | --- |
| Previous-round command: `$files = @(); $files += Get-ChildItem 'pipeline/src/pack' -Filter '*.test.mjs' \| ForEach-Object { $_.FullName }; $files += Get-ChildItem 'module/src' -Recurse -Filter '*.test.ts' \| ForEach-Object { $_.FullName }; node --test $files` | **79 passed, 0 failed** in the prior round. Round 2 rerun and the 83-pass/1-skip result are recorded below. |
| From `api/`: `.\node_modules\.bin\vitest.CMD run` | **57 passed across 5 files.** Includes manifest, CORS, OpenAPI, credential issue/revoke and API behavior tests. |
| From `api/`: `..\node_modules\.bin\tsc.CMD --noEmit` | **Passed.** |
| From `module/`: `.\node_modules\.bin\tsc.CMD --noEmit -p .\tsconfig.json` | **Passed.** |
| `node build-components.mjs` (previous round) | **Passed.** Before Round 2 splitting, built the unified bundle and component files. |
| Pre-split unified bundle measurement | **306,851 bytes raw; 66,772 bytes gzip.** This was the baseline before Round 2 dynamic splitting; current values are in the Round 2 table. |
| From `demo/sandbox-player/`: `node node_modules/vite/bin/vite.js build` | **Passed.** Vite output: HTML 35.20 KB (7.22 KB gzip); JS 224.05 KB (55.85 KB gzip). This is the sandbox page, not a standalone offline page. |
| From `demo/sandbox-player/`, previous round | **17 passed.** Round 2 now has 18 tests; see below. |
| From `demo/sandbox-career/`: `node node_modules/vite/bin/vite.js build; node node_modules/@playwright/test/cli.js test` | **Build passed; 15 browser/API tests passed.** Includes renamed test-key flow, Amharic/English, JSON-LD, credential/revocation, CORS, axe and layout checks. |
| From `api/`: `node node_modules/tsx/dist/cli.mjs scripts/export-openapi.ts` followed by `node node_modules/tsx/dist/cli.mjs scripts/check-openapi.ts` | **Passed.** Exported the OpenAPI 3.1 copy, validated it, and confirmed it matches route-derived output. |
| `docker compose config --quiet` | **Passed.** Compose configuration parses; no Docker image build or deployment was run. |
| Local API smoke: start API with `PORT=45174 STORE=memory`; run `node scripts/smoke-test.mjs --base http://localhost:45174 --media-base http://localhost:45174` with `SAVANNA_SMOKE_ORIGIN=http://localhost:5174`, `SAVANNA_SMOKE_API_KEY=pk_dev_local`, and `SAVANNA_SMOKE_CREDENTIAL_ID=C-7` | **10 checks passed.** Health, OpenAPI, L-102 manifest/CORS, video/audio types, EN/AM VTT parsing, video ranges, offline pack manifest and credential proof fields. Health is process-level and proof-field checks do not establish DB readiness or VC cryptographic conformance. |
| Previous player-only Amharic key parity | **141 English keys / 141 Amharic keys; 0 missing, 0 extra.** Round 2 compares all component dictionaries; this does not assess translation quality. |
| Round 1 `git diff --check` | **Passed.** In the final Round 2 staged diff, Git flags whitespace in the generated shared Lit chunk `savanna/module/chunks/chunk-2MOXT47L.js`: its template-literal regex intentionally contains literal space, tab, and newline characters. This is generated parser code, not accidental trailing whitespace; syntax and component build checks pass. Line-ending normalization warnings also appear for CRLF-configured files. |
| Scoped placeholder scan (`rg` documented in `docs/AUDIT-PITCH-DAY.md`) | No deployment placeholders were found in the requested paths; remaining localhost strings are local examples, dev defaults, test harnesses or tests. The audit document itself is excluded to avoid matching its scan pattern. |

## Round 2 — implementation and verification

The Round 2 changes were made on the existing local branch. No push, deployment, PR, or publish command was run.

| Command | Actual result |
| --- | --- |
| `node build-components.mjs; node scripts/size-check.mjs` | **Passed.** Player core entry 147,846 B raw / 29,719 B gzip; static import graph 37,301 B gzip; current course-page eager first-load graph 43,782 B gzip. The 60 KiB core budget is 61,440 B. No font files are in the JS graph. |
| Size graph optional chunks | Sign window: 11,766 B gzip including shared imports, loaded only for real sign media. Audio description: 10,164 B including shared imports, loaded only for audio+VTT. Offline control: 12,364 B, eager on the current course page. Job card: 11,772 B and credential: 9,816 B, loaded when present. Transcript tools: 932 B and Braille formatter: 2,596 B, loaded on user actions. These totals include shared chunks and should not be added together as a transfer estimate. |
| PowerShell Node test command shown below | **83 passed, 0 failed, 1 skipped** (84 total). The skipped test says L-104 production files are absent. It will enforce that captions reach at least 90% of the measured duration after an ingest. Includes navigation, audio-description synchronization, service worker, offline pack integrity, EN/AM Q&A, Amharic fixtures, light-page helper, and the H.264/AAC ingest guard. |
| `node scripts/check-amharic-parity.mjs` | **Passed.** Player 141/141, job card 16/16, credential 17/17: 174 user-facing string keys, 0 missing, 0 extra. Two identical values are the intended language selectors `አማ` and `EN`. This is key coverage only. Some Amharic-mode labels intentionally retain English language names in parentheses and file-format labels such as `.txt`/`.brf`. |
| API Vitest (`api`, `node_modules/.bin/vitest.CMD run`) | **57 passed in 5 files.** |
| Components TypeScript (`.\node_modules\.bin\tsc.CMD --noEmit -p .\module\tsconfig.json`) | **Passed.** |
| API TypeScript (`api`, `..\node_modules\.bin\tsc.CMD --noEmit`) | **Passed.** |
| Player Vite build (`demo/sandbox-player`, `node node_modules/vite/bin/vite.js build`) | **Passed.** Vite warned that the sandbox entry statically imports sign and audio-description components, so this test-harness build does not split those modules; the production component bundle size is measured separately above. |
| Player Playwright (`demo/sandbox-player`, `$env:SAVANNA_API_PORT='45174'; $env:PORT='5175'; node node_modules/@playwright/test/cli.js test --reporter=line`) | **18 passed.** Port 4010 was occupied by an unrelated local mock, so this successful run used free ports 45174 and 5175. The keyboard path covers play, captions, Amharic, sign movement, missing AD message, and Enter-to-seek; separate tests cover offline save/replay. |
| Career build and Playwright (`demo/sandbox-career`) | **Build passed; 15 tests passed.** Bundle output 49.30 kB raw / 13.71 kB gzip. |
| `node scripts/l104-ingest.test.mjs` | **2 passed, 1 skipped.** H.264/AAC stream guard and draft cue generation passed; production coverage skipped because no L-104 manifest or recorded media exists. |
| `node --check scripts/l104-ingest.mjs; node --check scripts/l104-ingest-lib.mjs` | **Passed.** |

The repository-suite command actually run in PowerShell was:

```powershell
$files = @()
$files += Get-ChildItem 'pipeline/src/pack' -Filter '*.test.mjs' -File | ForEach-Object { $_.FullName }
$files += Get-ChildItem 'module/src' -Recurse -Filter '*.test.ts' -File | ForEach-Object { $_.FullName }
$files += Get-ChildItem 'scripts' -Filter '*.test.mjs' -File | ForEach-Object { $_.FullName }
node --test $files
```

The original unified entry measured 66,772 B gzip before splitting. The current `pnpm size` script rebuilds then checks the core; Corepack/pnpm was not used because package-manager bootstrap may require network access. Its exact local equivalent above passed. The total first-load graph is reported separately to avoid hiding lazy chunks.

### Round 2 unfinished items

- The real L-104 video/audio, reviewed English cue timings, licensed/approved source record, approved Amharic captions, recorded AD and measured offset are not present. `ffmpeg` and `ffprobe` are not installed, so the actual ingest and generated-clip test could not be run. The helper and stream-guard tests are not a substitute for a generated media clip. L-104 remains absent from the lesson fixtures. The ingest requires H.264 video and embedded AAC narration; a supplied separate narration file is compressed only as an offline companion.
- The low-data pack builder targets mono 16 kbps Opus, enforces 1 MiB limits for unpacked assets and the ZIP, and creates a standalone page with inline CSS/JS and synchronized EN/AM VTT transcript. The one-cue template fixture measured 2,493 B and has no external script/style bundle. No production pack was generated or measured because there is no source audio/caption package and FFmpeg is unavailable. The existing `savanna-offline` UI still downloads the full manifest asset list; it does not offer a low-data/full-pack selector, and the audio-only page has not been tested from `file://` with real files.
- The credential flow remains a canonical-JSON Ed25519 prototype. It does not implement `eddsa-jcs-2022`, JSON Canonicalization Scheme conformance, a portable browser verifier, or a full W3C VC 2.0 Data Integrity verification flow. It must not be presented as VC-compliant.
- `pnpm build:site` was not run because it requires the team's actual HTTPS API origin and publishable key. No URL or credential was invented. Docker and production hosting were not exercised in Round 2; the earlier Compose parse check passed, but deployment still requires manual hosting and external configuration.

L-102 and L-103 each declare 120 seconds. Their video is 2,096,006 bytes; their offline pack declares 2,128,323 bytes. EN and AM VTT final cues end at `02:00.000`. The browser test observed `video.duration` at 120 seconds and a cached range response `206 bytes 0-1023/2096006`. `ffprobe` and `ffmpeg` were unavailable, so no ffprobe duration result is claimed.

Execution notes: `corepack pnpm test` could not start because Corepack could not download pnpm from `registry.npmjs.org` (`ENOTFOUND`); the already-installed Node test runner ran the repository suites directly and passed 79/79. The initial default-sandbox API attempt had 47 loopback `EACCES` failures (10 tests passed); rerunning with local-socket access passed all 57/57. One additional initial command used the wrong working directory/CLI path and failed before exercising the target; corrected build and test commands passed. An earlier API typecheck caught a mismatch in the new OpenAPI checker; it was corrected and the final typecheck passed. No application test failure remains from the corrected commands.

The repository does not define root `lint` or root `typecheck` scripts. The available API and components TypeScript checks were run directly. No linter or size-limit checker is configured, so those acceptance checks remain unavailable rather than passed.

## Incomplete work and why

- No separate original/licensed L-DEMO was created. The existing fixture’s source and redistribution rights are not recorded. Reusing or stretching that clip would misrepresent it as new production content.
- L-104 remains a 319-word English narration draft targeting 150 seconds (about 128 words per minute before pauses) with an Amharic translation draft. Ingest tooling is present, but no recorded video/narration, recording-matched captions, approved AD or production checksums exist; the lesson manifest is absent.
- No genuine, human-reviewed Ethiopian Sign Language recording exists. No sign language is presented as ESL.
- Amharic automated key/timing checks pass, but semantic quality, natural phrasing and UI fit need a qualified native-speaker review. No human approval evidence exists.
- AD demo audio/VTT files are fixture-only. Production availability remains false for L-102/L-103.
- Credential proof is not full W3C VC 2.0 Data Integrity/RDFC interoperability and no client verifier locally checks a pasted/uploaded credential. The mandatory portable-verifier innovation is incomplete.
- A standalone light-page generator and 1 MiB pack guard now exist, but no real pack was generated/measured. The offline UI has no low-data/full choice and the existing L-102/L-103 pack remains 2.03 MiB.
- The player core is below the 60 KiB gzip budget (29,719 B); its static and eager first-load totals are measured separately below. The CI workflow includes the budget check, but GitHub CI has not run.
- No coverage report establishes the requested 70% threshold. The repository also has no meaningful root lint script.
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

```text
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
