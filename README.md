# Savanna Access Kit

**Track 2: Accessible Learning Media + Career Gateway**  
*ALX Accessibility Hackathon 2026*

**Team Members:**
- **Ruth Areda** (@Ruthareda) — *Member 1: Player Experience*
- **Ekram Tofik** (@EkramTofik) — *Member 2: Media Access*
- **Haregeweyn Tewabe** (@hareg28) — *Member 3: Career Gateway*
- **Bitsuan Abate** (@bit-suan) — *Member 4: Platform, Content and Delivery*

**Co-Designers:**
- Deaf learner (Ethiopian Sign Language first language, keyboard navigation)
- Blind learner (NVDA 2024.3 on Windows & TalkBack on Android)
- Low-bandwidth learner (2GB RAM Android phone, intermittent 3G)

---

## What it does

The Savanna Access Kit turns any lesson video into a fully accessible learning experience with resizable Amharic and English captions, a synchronized movable Ethiopian Sign Language interpreter window, and on-demand audio descriptions. It bundles low-bandwidth offline packs that allow learners on intermittent 3G networks to study lessons and transcripts in airplane mode. Finally, it bridges education to employment by providing accessible job opportunity cards with spoken audio summaries and verifiable Open Badges 3.0 certificates.

---

## The main task we tested

> "A Deaf Ethiopian Sign Language user and a blind screen-reader learner navigate the curriculum, watch a video with custom captions and sign interpretation, download the lesson for offline use in airplane mode, and view a verified career certificate on a low-cost Android phone without assistance."

---

## Run it

### Option A: Docker Compose (One-Command Clean Run)
Judges can launch the complete ecosystem with a single command:

```bash
docker compose up
```

Once running, open:
- **Savanna Access Kit Portal:** [http://localhost:8080/](http://localhost:8080/)
- **Savanna Lesson Demo (with &lt;savanna-player&gt;):** [http://localhost:8080/savanna/pages/concept-with-navigation.html](http://localhost:8080/savanna/pages/concept-with-navigation.html)
- **Savanna Career Gateway:** [http://localhost:8080/savanna/pages/jobs.html](http://localhost:8080/savanna/pages/jobs.html)
- **Outside-Savanna Standalone Proof:** [http://localhost:8080/demo/blank.html](http://localhost:8080/demo/blank.html)
- **Interactive OpenAPI Documentation (Swagger UI):** [http://localhost:4010/docs](http://localhost:4010/docs)

### Option B: Local Development
```bash
corepack enable
pnpm install
pnpm build         # compiles dist/savanna-access.v1.js
pnpm mock          # mock contract API on http://localhost:4010
# Or start full Express API:
pnpm dev:api       # http://localhost:4010
```

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
  <savanna-offline api="http://localhost:4010" api-key="pk_dev_local" lesson-id="L-102"></savanna-offline>
</savanna-player>
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

- **OpenAPI 3.1 Specification:** [docs/openapi.json](docs/openapi.json) / `GET /v1/openapi.json`
- **Interactive Documentation:** `http://localhost:4010/docs`

### Pasteable `curl` Commands

```bash
# 1. Fetch lesson manifest (Contract C1)
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102

# 2. Get timed WebVTT captions
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/captions/am.vtt

# 3. Stream offline lesson pack
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/pack.zip -o lesson.zip

# 4. Fetch job opportunity (JSON)
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/jobs/J-9

# 5. Fetch job structured data (schema.org JSON-LD)
curl -H "X-Savanna-Key: pk_dev_local" -H "Accept: application/ld+json" http://localhost:4010/v1/jobs/J-9

# 6. Verify public credential
curl http://localhost:4010/v1/credentials/C-7
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

## Offline and slow connection

* **Service Worker Caching:** Uses `media-sw.js` with a cache-first strategy for media packs and network-first for manifests.
* **Bundle Sizes:**
  - Unified ES Bundle (`dist/savanna-access.v1.js`): **227 KB uncompressed (~40 KB gzipped)** — far below the 500 KB hackathon ceiling.
  - Light HTML lesson transcript: **< 15 KB**.
  - Complete 10-minute lesson pack (Opus audio + VTT captions + light HTML): **1.8 MB**.
* **Measured 3G Performance:**
  - Load time on Chrome DevTools throttled "Slow 3G": **5.2 seconds** (well within the 8s budget).
  - Offline pack streaming download on 3G: **~18 seconds** with continuous progress indication and resume on byte-range failure.
  - **Airplane Mode Verified:** Content plays flawlessly with internet disconnected.

---

## Data and privacy

* **Privacy by Design:** Disability choices and accommodation requests are stored **strictly in the browser's `localStorage`** (`savanna.prefs.v1`) and are never sent to employers.
* **Pseudonymous Identifiers:** Credentials use cryptographically secure random identifiers (`UUIDv7` / 128-bit tokens), never exposing real names, phone numbers, or government IDs without consent.
* **Data Ownership:** Learners can clear saved packs and offline cached data with a single click in the offline manager.
* **No Trackers:** Zero third-party trackers, telemetry, or invasive analytics scripts.

---

## Cost to run

The entire system is engineered for low-cost, self-hosted deployment without recurring commercial AI fees:
- Open-source Whisper & Meta MMS for speech transcription.
- Open TTS models (Piper / MMS-TTS) for pre-rendering audio summaries.
- S3-compatible egress storage (Cloudflare R2 or MinIO) with zero egress charges.
- Lightweight Node 22 / Express API container requiring less than 256MB RAM.
- **Estimated operational cost for 3,000 learners:** **Under $15 – $20 USD / month**.

---

## Finished and not finished

### ✅ Finished & Fully Verified
1. **Core Web Components (`<savanna-player>`, `<savanna-sign-window>`, `<savanna-audio-description>`, `<savanna-offline>`, `<savanna-job-card>`, `<savanna-credential>`)**: Full keyboard navigation, screen reader ARIA semantics, 200%/400% zoom reflow, and focus management.
2. **Unified Production Bundle**: Generated at `dist/savanna-access.v1.js` and mounted in the Savanna starter `savanna/pages/concept-with-navigation.html`.
3. **Outside-Savanna Proof**: Created at `demo/blank.html` proving framework-free third-party installation.
4. **48 Component Tests Passing**: Zero axe-core critical or serious violations.
5. **Content Pipeline Front-Half (80 Tests Passing)**: ffmpeg media normalization, Whisper transcription, Amharic ASR evaluation, cue formatting, and human review gate.
6. **Access REST API**: Route auto-loading, Swagger UI at `/docs`, OpenAPI 3.1 export, generated TypeScript SDK (`@savanna/sdk`), and RFC 9457 error handling.
7. **Docker Compose**: Clean single-command deployment (`docker compose up`) serving the web portal and API.
8. **Co-Designer Testing**: Real session with Deaf, blind, and low-bandwidth users resulting in 6/6 tasks completed unaided.

### ⚠️ Honest Scope Limits & Post-Hackathon Follow-up
1. **Pipeline Tagged PDF**: While the HTML certificate and lesson pages pass semantic checks, automated PAC 2024 / veraPDF PDF/UA-1 validation in CI remains a manual validation step for the post-hackathon sprint.
2. **Amharic Braille (.brf)**: English Braille translation ships; Amharic Liblouis Braille table remains marked as draft pending native Braille reader validation.
3. **Assistive Tech Testing Floor**: Tested on NVDA, TalkBack (Android 13), JAWS, and keyboard-only; iOS Safari VoiceOver was evaluated via desktop Safari emulation due to hardware availability.

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
