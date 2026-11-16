# Savanna Access Kit

**Track 2: Accessible Learning Media + Career Gateway**  
*ALX Accessibility Hackathon 2026*

**Team Members:**
- **Ruth Areda** (@Ruthareda) — *Member 1: Player Experience*
- **Ekram Tofik** (@EkramTofik) — *Member 2: Media Access*
- **Haregeweyn Tewabe** (@hareg28) — *Member 3: Career Gateway*
- **Bitsuan Abate** (@bit-suan) — *Member 4: Platform, Content and Delivery*

**User research status:** This repository contains no evidence for a participant session that I can verify in this integration. The workflows below are product goals; automated browser checks are reported separately and are not presented as co-design or assistive-technology testing.

---

## What it does

The Savanna Access Kit is a set of web components, an API, and demos for accessible learning media and career content. It includes a lesson player with captions, optional sign-language and audio-description tracks, an offline pack control, and career cards and credentials. Support depends on the tracks and API data supplied by the host. The repository includes development fixtures; it is not a catalog of production lesson media.

---

## Target learner workflow

> "A learner opens a lesson, selects the available caption, sign-language, or audio-description support, adjusts it, and saves the lesson for offline use."

This is a product scenario, not a claim that a participant completed the task. See [the test plan](docs/TEST-PLAN.md) and [the current conformance status](CONFORMANCE.md) for verification evidence and outstanding manual checks.

---

## Run it

### Prerequisites

- Node.js 22 or newer and Corepack; the repository pins pnpm 9.15.0.
- Docker Engine is optional and required only for the Compose setup.

### Option A: Docker Compose

With Docker Desktop or another Docker Engine running, build and start the web and API containers:

```bash
docker compose up --build
```

Once running, open:
- **Savanna Access Kit Portal:** [http://localhost:8080/](http://localhost:8080/)
- **Savanna Lesson Demo (with &lt;savanna-player&gt;):** [http://localhost:8080/savanna/pages/concept-with-navigation.html](http://localhost:8080/savanna/pages/concept-with-navigation.html)
- **Savanna Career Gateway:** [http://localhost:8080/savanna/pages/jobs.html](http://localhost:8080/savanna/pages/jobs.html)
- **Outside-Savanna Standalone Proof:** [http://localhost:8080/demo/blank.html](http://localhost:8080/demo/blank.html)
- **WebVTT Caption Editor (Human Review Gate):** [http://localhost:8080/demo/caption-editor/index.html](http://localhost:8080/demo/caption-editor/index.html)
- **Interactive OpenAPI Documentation (Swagger UI):** [http://localhost:8080/docs](http://localhost:8080/docs)

### Option B: Local Development
```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm test
corepack pnpm -r --if-present typecheck
corepack pnpm -r --if-present test
corepack pnpm axe
```

Start the fixture API in a separate terminal with `corepack pnpm mock` (port 4010), or use `corepack pnpm dev:api` for the Express API. The API defaults to port 4010; configure `PORT`, `MEDIA_ROOT`, and `PACK_ROOT` for a deployment. Browser tests start their own Vite and mock-server processes. Playwright browsers must be installed for the first run (`corepack pnpm --filter @savanna/sandbox-player exec playwright install chromium`).

---

## Deploy a public preview

The repository includes a Render Blueprint and step-by-step hosting and smoke-check instructions in [DEPLOY.md](DEPLOY.md). The free preview uses fixture content and in-memory demo data; it is not configured for production learner records.

---

## Install, Level 1

Add the unified bundle to any HTML page with **one script tag**:

```html
<script type="module" src="https://cdn.example.org/savanna-access.v1.js"></script>
```

### Components & Attributes

#### 1. `<savanna-player>`
```html
<savanna-player
  id="lesson-player"
  lesson="L-102"
  lang="am"
  api="http://localhost:4010"
  api-key="pk_dev_local"
>
  <savanna-sign-window slot="overlay"></savanna-sign-window>
  <savanna-audio-description></savanna-audio-description>
</savanna-player>
<savanna-offline api="http://localhost:4010" api-key="pk_dev_local" lesson-id="L-102"></savanna-offline>
```
*Attributes:* `lesson` (e.g. `L-102`), `lang` (`"am"` or `"en"`), `api` (base URL), `api-key` (public publishable key).

#### 2. `<savanna-job-card>`
```html
<savanna-job-card job="J-9" api="http://localhost:4010" api-key="pk_dev_local" lang="am"></savanna-job-card>
```
*Attributes:* `job` (job id, e.g. `J-9`), `lang`, `api`, `api-key`.

#### 3. `<savanna-credential>`
```html
<savanna-credential id="C-7" api="http://localhost:4010" api-key="pk_dev_local" lang="am"></savanna-credential>
```
*Attributes:* `id` (credential id, e.g. `C-7`), `lang`, `api`, `api-key`.

### Events Out (Contract C2)
All components dispatch bubbles and composed `CustomEvent`s:
```javascript
document.addEventListener("savanna:ready", (e) => console.log(e.detail));
document.addEventListener("savanna:play", () => console.log("Playing"));
document.addEventListener("savanna:pause", () => console.log("Paused"));
document.addEventListener("savanna:seek", (e) => console.log("Seek:", e.detail.time));
document.addEventListener("savanna:timeupdate", (e) => console.log(e.detail.time));
document.addEventListener("savanna:caption-change", (e) => console.log(e.detail.lang));
document.addEventListener("savanna:complete", () => console.log("Finished"));
document.addEventListener("savanna:error", (e) => console.error(e.detail));
window.addEventListener("savanna:lang-change", (e) => console.log(e.detail.lang));
```

---

## Install, Level 2

The Access API provides versioned REST endpoints under `/v1` adhering to RFC 9457 `application/problem+json` error structures.

- **OpenAPI 3.1 Specification:** [openapi.yaml](openapi.yaml) (repo root) & [docs/openapi.json](docs/openapi.json) / `GET /v1/openapi.json`
- **Interactive Documentation:** `http://localhost:4010/docs`

### API Path Aliases (FR-N3)
The API serves all handlers under both `/v1/...` and `/api/v1/...` to ensure complete compatibility:

| Guide Path | Canonical Route | Handling | Notes |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/lessons/{id}` | `GET /v1/lessons/{id}` | Alias | Complete C1 manifest |
| `GET /api/v1/lessons/{id}/transcript?lang=am` | `GET /v1/lessons/{id}/transcript` | Alias | Timed Amharic lines |
| `GET /api/v1/lessons/{id}/offline-pack` | `GET /v1/lessons/{id}/pack.zip` | Alias | Byte-range resumable ZIP |
| `POST /api/v1/lessons/{id}/captions` | `POST /v1/lessons/{id}/captions` | New route | Caption review & validation gate |
| `GET /api/v1/preferences/export` | `GET /v1/preferences/export` | Alias | Download user preferences |
| `DELETE /api/v1/preferences` | `DELETE /v1/preferences` | Alias | Delete user preferences |

### Pasteable `curl` Commands

```bash
# 1. Fetch lesson manifest (Contract C1)
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102

# 2. Get timed WebVTT captions
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/captions/am.vtt

# 3. Stream offline lesson pack (or via alias /api/v1/lessons/L-102/offline-pack)
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/pack.zip -o lesson.zip

# 4. Upload & review corrected captions (FR-A2 - requires secret key)
curl -X POST http://localhost:4010/v1/lessons/L-102/captions \
  -H "X-Savanna-Key: sk_dev_local_change_me_please" \
  -H "Content-Type: application/json" \
  -d '{"lang":"am","vtt":"WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.500\nእንኳን ወደዚህ ትምህርት በደህና መጡ።\n"}'

# 5. User preferences export & delete (FR-A4 / NFR-S3)
curl -H "X-Savanna-Key: pk_dev_local" -H "X-Savanna-User: user-token-aaaaaaaaaaaa" \
  http://localhost:4010/v1/preferences/export

curl -X DELETE -H "X-Savanna-Key: pk_dev_local" -H "X-Savanna-User: user-token-aaaaaaaaaaaa" \
  http://localhost:4010/v1/preferences

# 6. Webhook registration & delivery demo (FR-A5)
curl -X POST http://localhost:4010/v1/webhooks \
  -H "X-Savanna-Key: sk_dev_local_change_me_please" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://partner.example.org/webhooks","events":["lesson.reviewed","credential.issued"]}'

# 7. Fetch job opportunity (JSON) & schema.org JSON-LD
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/jobs/J-9
curl -H "X-Savanna-Key: pk_dev_local" -H "Accept: application/ld+json" http://localhost:4010/v1/jobs/J-9

# 8. Verify public credential & DID document
curl http://localhost:4010/v1/credentials/C-7
curl http://localhost:4010/.well-known/did.json
```

---

## Install, Level 3

1. **schema.org/JobPosting:** Embedded as JSON-LD in `<savanna-job-card>` and exposed at `/v1/jobs/{id}.jsonld` for Google Jobs, LinkedIn, and job aggregator indexing.
2. **Open Badges 3.0 / W3C Verifiable Credentials:**
   - Compliant with W3C VC Data Model 2.0.
   - Hosted verification at `/verify/{id}` with QR code and keyboard-accessible sharing.
   - DID web resolution at `/.well-known/did.json` with Ed25519 signature proof structures.

---

## Languages and how to add one

* **Built for Ethiopia:** Complete Amharic localization (`i18n/am.json`) with no missing glyphs. Uses the `Noto Sans Ethiopic` font stack with 1.7 line height for optimal readability.
* **Ethiopian Calendar:** Built-in date formatting via `Intl.DateTimeFormat('am-ET-u-ca-ethiopic')` displays authentic dates (e.g., `5 ኅዳር 2019`).
* **Bilingual Switch:** Live language toggle triggers `savanna:lang-change` without reloading the page.
* **Adding New Languages:** All text resides in external JSON files. To add Afaan Oromo, Tigrinya, Somali, or Arabic:
  1. Add `<lang>.json` in the respective component `i18n/` directory.
  2. For RTL languages (Arabic), all styles use CSS logical properties (`margin-inline-start`, `padding-inline`, `dir="auto"`).

---

## Offline packs

The offline control validates the lesson and pack manifests, downloads only declared resources, supports HTTP byte-range resume, checks each resource's byte count and SHA-256 hash, and stores completed assets in Cache Storage. The player and caption loader can reuse those cached assets after connectivity is lost. Service-worker shell caching is available when the built site serves `media-sw.js` from its root; offline media fallback also uses Cache Storage directly.

The checked-in fixture packs currently declare 29,657 payload bytes for L-102 (Opus audio and English/Amharic VTT) and 51,761 bytes for L-103 (the same plus audio-description tracks and an ESL placeholder video). These are fixture sizes, not network-performance measurements or production lesson content. The current browser tests verify offline playback fallback on an already loaded page and a resumed interrupted range download; they do not verify a cold offline page reload.

---

## Fixture and content limits

The fixture pack manifest declares individual resource sizes and SHA-256 hashes. The API and browser parser reject invalid hashes, unsafe or duplicate paths, and aggregate sizes that do not equal the listed files. L-102 currently has no sign or audio-description track; its transcript is served by the API and is not included as a separate offline file. L-103's sign asset is explicitly a placeholder. Fixture presence and automated checks do not establish that captions, signing, or descriptions are editorially approved or suitable for real lessons.

---

## Caption quality

No caption word-error-rate study or human editorial review was performed as part of this integration pass. The API validates VTT structure and supports an authenticated caption-upload/review route; that structural gate does not certify linguistic accuracy or production approval.

---

## Data and privacy

The player and accessibility components keep their local preferences in the browser under namespaced keys. The API also exposes authenticated per-user preference read, export, update, and delete routes. Whether a deployment synchronizes preferences depends on how its host application calls those routes. Review deployment logging, storage, and credential policies before using real learner data; this repository review did not perform a privacy or telemetry audit.

---

## Cost to run

No load test, cloud bill, or operating-cost estimate was produced in this integration pass. Hosting cost depends on deployment, storage, media delivery, and any external transcription or speech services selected by the operator.

---

## Verification status

This repository has unit/contract tests, API tests, Playwright browser projects, TypeScript checks, a production build, and an axe-core runner. The actual results from the current integration pass and the remaining manual checks are recorded in [CONFORMANCE.md](CONFORMANCE.md). Automated accessibility checks do not establish WCAG conformance or replace keyboard, zoom, device, screen-reader, and human content review.

---

## Libraries and their licences

| Library | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| `lit` | ^3.2.1 | BSD-3-Clause | Lightweight web component foundation & Shadow DOM |
| `express` | ^4.21.2 | MIT | REST API server framework |
| `zod` | ^3.24.2 | MIT | Schema validation & OpenAPI definition |
| `helmet` | ^8.3.0 | MIT | HTTP security headers |
| `cors` | ^2.8.5 | MIT | Origin-restricted CORS middleware |
| `swagger-ui-dist`| ^5.35.0 | Apache-2.0 | Interactive API documentation |
| `qrcode` | ^1.5.4 | MIT | Accessible credential QR code generation |
| `esbuild` | ^0.28.2 | MIT | High-performance component bundler |
| `vitest` | ^5.1.0 | MIT | Unit and contract test runner |
| `@playwright/test`| ^1.49.1 | Apache-2.0 | End-to-end browser and accessibility testing |
| `@axe-core/playwright`| ^4.10.1| MPL-2.0 | Automated WCAG 2.2 accessibility validation |
| `archiver` | ^7.0.1 | MIT | Offline lesson pack ZIP bundling |
