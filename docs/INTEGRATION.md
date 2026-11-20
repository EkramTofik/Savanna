# Savanna Access Kit — Integration Guide (Levels 1, 2, 3)

The Savanna Access Kit is a prototype designed as a lightweight module that integrates at three levels:

- **Level 1 (Script Tag):** Drop-in custom elements on any client web page with zero host dependencies.
- **Level 2 (REST API):** Typed, versioned backend endpoints with an OpenAPI 3.1 contract and SDK.
- **Level 3 (Open Standards):** Open Badges / W3C credential examples and schema.org JobPosting JSON-LD. Credential proof generation is a prototype; it does not yet provide the complete RDFC-1.0 canonicalization needed for interoperable Data Integrity verification.

The copyable snippets below use the repository's local demo API (`http://localhost:4010`) and its development-only key (`pk_dev_local`). They are not production URLs or credentials. No production origin or key is configured in this repository.

---

## Level 1: Client Web Components (Script Tag)

### 1. Installation

Include the single production module bundle in your HTML `<head>`:

```html
<!-- Load the unified component bundle -->
<script type="module" src="/savanna/module/savanna-access.v1.js"></script>
```

### 2. Placement

#### A. Accessible Learning Media (`<savanna-player>`)

```html
<savanna-player
  id="lesson-player"
  lesson="L-102"
  lang="am"
  api="http://localhost:4010"
  api-key="pk_dev_local"
>
  <!-- Slotted Ethiopian Sign Language Window -->
  <savanna-sign-window slot="overlay"></savanna-sign-window>

  <!-- Synchronized Audio Description -->
  <savanna-audio-description></savanna-audio-description>

  <!-- Offline Pack Downloader -->
  <savanna-offline
    api="http://localhost:4010"
    api-key="pk_dev_local"
    lesson-id="L-102"
  ></savanna-offline>
</savanna-player>
```

**Current fixture availability:** L-102 and L-103 include English and Amharic VTT files, but both declare `sign: null`
and `audioDescription: null`. The sign window displays its unavailable fallback; the audio-description control stays
disabled. The offline downloader includes only assets supplied by that lesson manifest. The repository does not include
a native-review record for the Amharic captions.

**Optional access tracks:** A verified sign asset can declare `url`, measured `offsetMs`, and an optional `languageName`.
The player passes that language name to the responsive sign window so its controls and region have context. Use
`Ethiopian Sign Language` only for a recording verified as Ethiopian Sign Language. Audio description remains disabled
until the manifest supplies an audio URL and VTT URL, the VTT loads with at least one valid cue, and the measured
`offsetMs` is provided. Playback errors disable the track and announce that it is unavailable. The VTT cue timeline and
audio playback both follow the lesson offset. Missing tracks remain null and are omitted from offline downloads. See
`docs/production/ESL_RECORDING_REQUIREMENTS.md` for the recording acceptance checklist.

**Attributes:**

| Attribute | Type   | Default  | Description                                                                 |
| :-------- | :----- | :------- | :-------------------------------------------------------------------------- |
| `lesson`  | string | required | Lesson identifier (e.g. `L-102`).                                           |
| `lang`    | string | `"en"`   | Active language (`"am"` or `"en"`). Spoken captions and UI adapt instantly. |
| `api`     | string | `""`     | Base URL of the Access API.                                                 |
| `api-key` | string | `""`     | Publishable key (origin-restricted, e.g. `pk_live_...`).                    |

#### B. Career Gateway (`<savanna-job-card>` & `<savanna-credential>`)

```html
<!-- Accessible Job Card with pre-rendered Audio Summary -->
<savanna-job-card
  job="J-9"
  lang="am"
  api="http://localhost:4010"
  api-key="pk_dev_local"
></savanna-job-card>

<!-- Cryptographic Verifiable Credential Badge -->
<savanna-credential
  id="C-7"
  lang="am"
  api="http://localhost:4010"
  api-key="pk_dev_local"
></savanna-credential>
```

### 3. Events Out (Contract C2)

All components dispatch bubbles & composed CustomEvents that the host can listen for:

```javascript
// Listen to media lifecycle events
document.addEventListener("savanna:ready", (e) => console.log("Player initialized", e.detail));
document.addEventListener("savanna:play", () => console.log("Playback started"));
document.addEventListener("savanna:pause", () => console.log("Playback paused"));
document.addEventListener("savanna:seek", (e) => console.log("Seeked to second:", e.detail.time));
document.addEventListener("savanna:timeupdate", (e) => {
  // e.detail: { time, paused, rate }
});
document.addEventListener("savanna:caption-change", (e) =>
  console.log("Caption track:", e.detail.lang),
);
document.addEventListener("savanna:complete", () => console.log("Lesson completed"));
document.addEventListener("savanna:error", (e) => console.error("Player error:", e.detail));

// Listen to host-wide language switch
window.addEventListener("savanna:lang-change", (e) => {
  console.log("Language switched to:", e.detail.lang);
});
```

### 4. Theming (CSS Custom Properties)

All elements use Shadow DOM. You can customize branding by setting tokens on the host or `:root`:

```css
:root {
  --savanna-accent: #0284c7; /* Primary brand color */
  --savanna-font: system-ui, sans-serif; /* Host typography */
  --savanna-radius: 8px; /* Corner radii */
  --savanna-focus: #f59e0b; /* High-contrast focus outline */
}
```

_Accessibility Clamp:_ Focus rings and minimum text contrasts are strictly clamped to WCAG AA thresholds inside the Shadow DOM and cannot be overridden below 4.5:1 (text) or 3:1 (controls).

---

## Level 2: Access REST API

The API provides structured JSON endpoints with RFC 9457 `application/problem+json` error semantics.

- **Base URL:** `http://localhost:4010/v1` (or production host)
- **OpenAPI 3.1 Spec:** `GET /v1/openapi.json`
- **Interactive Swagger UI:** `GET /docs`
- **Auth Header:** `X-Savanna-Key: pk_dev_local` (local development only)

### Core Endpoints

#### 1. Get Lesson Manifest

```bash
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102
```

#### 2. Get Timed Captions (WebVTT)

```bash
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/captions/am.vtt
```

#### 3. Download Offline Pack

```bash
curl -H "X-Savanna-Key: pk_dev_local" http://localhost:4010/v1/lessons/L-102/pack.zip -o lesson-pack.zip
```

#### 4. Fetch Job with JSON-LD

```bash
curl -H "X-Savanna-Key: pk_dev_local" -H "Accept: application/ld+json" http://localhost:4010/v1/jobs/J-9
```

#### 5. Verify Credential

```bash
curl http://localhost:4010/v1/credentials/C-7
```

### Generated TypeScript SDK (`@savanna/sdk`)

Install and use the generated typed client:

```typescript
import { createClient } from "@savanna/sdk";

const client = createClient({
  baseUrl: "http://localhost:4010",
  headers: { "X-Savanna-Key": "pk_dev_local" },
});

const { data: lesson } = await client.GET("/v1/lessons/{id}", {
  params: { path: { id: "L-102" } },
});
console.log(lesson.title.am, lesson.durationSec);
```

---

## Level 3: Open Standards

1. **schema.org/JobPosting:** Embedded as JSON-LD in all job cards and accessible at `/v1/jobs/{id}.jsonld` for immediate ingestion by external job boards, Google Jobs, and career aggregators.
2. **Open Badges 3.0 / W3C Verifiable Credentials:**
   - Compliant with W3C VC Data Model 2.0.
   - Hosted verification at `/verify/{id}` with QR code and accessible fallback.
   - Cryptographic proof verification using Ed25519 signatures and `did:web` identifier discovery.
