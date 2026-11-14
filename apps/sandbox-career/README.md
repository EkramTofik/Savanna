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

## Tests

```bash
npm run test:api
npm test
```

Automated checks: `node --test test/api.node.test.mjs` (API) and `npm test` (Playwright + axe-core, zoom, keyboard).

## Honesty notes (say this to judges)

- Hosted verification is the supported path (server lookup, status valid/revoked/expired).
- An Ed25519 proof is attached as a **draft** (canonical JSON, not full RDFC-1.0 Data Integrity). `did:web` is served at `/.well-known/did.json`.
- Certificate PDF is generated from accessible HTML via Playwright `page.pdf({ tagged: true })`. PAC/veraPDF still need a human pass on Saturday.
- Amharic audio uses Windows SAPI when a voice exists; otherwise a short placeholder WAV plus a full transcript.

## Script-tag install (this slice only)

After `npm run build`, partners can load `dist/savanna-career.v1.js` and drop in:

```html
<savanna-job-card job="J-9" api="https://api.example.org" api-key="pk_live_xxx"></savanna-job-card>
<savanna-credential id="C-7" api="https://api.example.org" api-key="pk_live_xxx"></savanna-credential>
```
