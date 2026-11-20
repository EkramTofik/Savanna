# Pitch-day changes

This changelog records the local pitch-day work on branch `pitch-day-fixes`. No remote push, deployment, or release was performed.

## Verification and documentation

- Added a Phase A repository audit with evidence, exact scoped placeholder/local-origin matches, and partial/missing status for the requirements.
- Added content provenance, Ethiopian Sign Language production workflow, Amharic/accessibility status, pitch walkthrough, screen-recording backup instructions, and six-slide outline.
- Added an honest deployment checklist for Render static hosting, API, and PostgreSQL. It contains no deployed URL, credentials, or claim of a completed deployment.
- Added “Why this works for Ethiopia” to the README with a clear note that field validation and native-speaker review have not happened.
- Added an OpenAPI check that validates the committed OpenAPI 3.1 JSON and compares it with the current route-derived document. Added root `openapi:build` / `openapi:check` scripts and CI steps for the check, component build, and player browser/axe suite.
- Added `pnpm smoke` to check a configured local or hosted API origin; CI runs it against a fixture API. The career sandbox install example now uses an origin-relative asset path, and webhook registration asks for a callback URL controlled by the team instead of a fictional endpoint.

## Existing implementation verified in this round

- Course menu links target the two real lesson fixtures; missing VA activities remain unavailable. Tests check real fixture IDs, query routes, selected state, browser history and native anchors.
- Lesson manifests and browser media agree on a 120-second L-102/L-103 fixture. EN/AM cues reach 02:00; exact offline asset sizes and SHA-256 checks are automated. The separate L-DEMO production request remains incomplete because no source-rights record or production media exists.
- Offline download validates declared size and SHA-256, retries failed files without discarding completed files, and replays cached media/captions after Playwright goes offline. Existing pack size is 2,128,323 bytes.
- Audio-description and sign-window components have sync, offset, keyboard and missing-media coverage. Production manifests keep both features unavailable; the fixture media is excluded from the generated static site.
- Renamed the Career Gateway sandbox’s fixed test keys from `pk_live_demo`/`sk_live_demo` to `pk_demo_local`/`sk_demo_local` throughout harness, docs and tests, and made the API CORS test key explicitly `pk_test_only_12345` to remove live-key wording.

## Known gaps remain

- No production L-DEMO, audio-description recording, or genuine Ethiopian Sign Language recording.
- No qualified native Amharic review, accessibility user testing, production hostname, production credentials, or hosted smoke test.
- The generated player bundle is 66,772 bytes gzip, over the requested 60 KB budget. The current offline pack is about 2.03 MiB, and there is no L-102/L-103 light standalone page in the pack.
- Credential signing remains a prototype without local browser verification and full W3C VC 2.0 Data Integrity interoperability.
- CI has not been run by GitHub; no meaningful lint or size-budget script exists.
