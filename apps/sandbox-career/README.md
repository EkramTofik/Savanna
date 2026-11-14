# Member 3 — Career Gateway sandbox

Owns: `<savanna-job-card>`, `<savanna-credential>`, jobs/credentials/verify API, JobPosting JSON-LD, hosted Open Badges verification, certificate PDF.

Does not wait on the player or the lesson pipeline. Talks to this harness on `http://localhost:4020` (or Member 4's mock on `:4010` once it serves the same fixtures).

## Run (no npm)

Windows TLS to the npm registry is failing on this machine (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), so this slice also runs on Node only:

```bash
cd apps/sandbox-career
node scripts/write-wav.mjs
node harness/server.mjs
```

Then open http://localhost:4020

```bash
node --test test/api.node.test.mjs
```

Keys: publishable `pk_live_demo`, secret `sk_live_demo`.

## Run the UI and API together

Start the local API harness and Vite UI in one terminal from the repository root:

```bash
pnpm --filter sandbox-career dev
```

Open http://localhost:5173. This command starts both required services: Vite on port
5173 and the API harness on port 4020. Do not start only `ui-only` unless the API
harness is already running. To use the no-build harness page instead, start
`node apps/sandbox-career/harness/server.mjs` and open http://localhost:4020.

## Tests

```bash
npm run test:api
npm test
```

Automated checks: `node --test test/api.node.test.mjs` (API) and `npm test` (builds the
bundle, then runs Playwright + axe-core, audio duration, 320 px reflow, 200%/400% zoom,
keyboard and partner-page integration checks).

## Requirements and handoff

- [CareerGateway task matrix](./CAREERGATEWAY-TASKS.md) maps every task (3.1–3.9) to its
  SRS reference, priority, points, evidence and remaining manual checks.
- [Saturday verification runbook](./SATURDAY-TASKS.md) covers NVDA/TalkBack co-design,
  audio listening, mobile/browser checks and PAC/veraPDF review.

## Integrate on another platform

The production build is a self-contained ES module: it bundles Lit and registers both
custom elements, so the host does not need Vite, React, Vue or Angular. Build it from the
repository root:

```bash
pnpm --filter sandbox-career build
```

Copy `apps/sandbox-career/dist/savanna-career.v1.js` to your site's static assets or
publish it to your CDN. Load it once, then use either element in any HTML template:

```html
<script type="module" src="/assets/savanna-career.v1.js"></script>

<savanna-job-card
  job="J-9"
  api="https://api.example.org"
  api-key="pk_live_xxx"
  lang="am"
></savanna-job-card>

<savanna-credential
  id="C-7"
  api="https://api.example.org"
  api-key="pk_live_xxx"
  lang="am"
></savanna-credential>
```

In React, Vue and Angular, load the same module once from the app shell and place the
custom-element tags in the component template. Keep values as strings/HTML attributes.
Both elements emit `savanna:ready` and `savanna:error` and reload when their identifying
attributes or API settings change. See the [platform integration guide](./PLATFORM-INTEGRATION.md)
for framework-specific React, Vue and Angular examples, including event handling.
The [partner demo page](./partner-demo.html) and Playwright test exercise the built bundle
against the API on a different port.

For a deployed integration, serve both the partner site and API over HTTPS. Configure the
API CORS allowlist for the exact partner origins and permit `GET`, `POST`, `OPTIONS` and
the `X-Savanna-Key` header. The browser components must only receive a **publishable**
key (`pk_...`); keep secret keys (`sk_...`) on your server for issuing/revoking
credentials. Certificate downloads use the public `/verify/{id}/pdf` endpoint, so the
normal anchor link does not need to expose an API key. Do not put secret keys in URLs,
HTML or client-side code.

Components are block-level and reflow to their available width. The job card and
credential controls have 44 px minimum targets. Host pages should avoid fixed-width
wrappers and must preserve room for focus outlines.

## Honesty notes (say this to judges)

- Hosted verification is the supported path (server lookup, status valid/revoked/expired).
- An Ed25519 proof is attached as a **draft** (canonical JSON, not full RDFC-1.0 Data Integrity). `did:web` is served at `/.well-known/did.json`.
- Certificate PDF is generated from accessible HTML via Playwright `page.pdf({ tagged: true })`. PAC/veraPDF still need a human pass on Saturday.
- Amharic audio uses Windows SAPI when a voice exists; otherwise a short placeholder WAV plus a full transcript.

## Script-tag install (this slice only)

After `npm run build`, partners can load `dist/savanna-career.v1.js` and drop in:

```html
<savanna-job-card job="J-9" api="https://api.example.org" api-key="pk_live_xxx"></savanna-job-card>
<savanna-credential
  id="C-7"
  api="https://api.example.org"
  api-key="pk_live_xxx"
></savanna-credential>
```
