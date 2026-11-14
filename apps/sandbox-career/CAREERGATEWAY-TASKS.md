# CareerGateway Task Matrix

Mission: deliver the job card and verifiable certificate front to back.

Scope: `apps/sandbox-career/index.html`, the local API harness, and the CareerGateway
components/API. This work does not depend on the player or lesson content.

## Requirements

| ID | Task | SRS | Priority | Points | Status and evidence |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `<savanna-job-card>` semantic facts, single-column reflow and 44 px targets | FR-J1, FR-J3 | M | 3 | Implemented. Uses an article, heading and `<dl>`; Playwright checks 320 px and 200%/400% zoom. |
| 3.2 | Play/stop audio, transcript, no autoplay; generate 20–30 second EN/AM audio per job | FR-J2 | M | 2 | Implemented for the checked-in J-9/J-10 audio. Browser tests decode all four files and assert 20–30 seconds. Screen-reader and human listening checks remain in the runbook. |
| 3.3 | Prisma job model, jobs routes, schema.org `JobPosting` JSON-LD and seed data | FR-J4 | M | 2 | Implemented. Prisma model is in `apps/api/prisma/schema/career.prisma`; JSON fixtures seed the sandbox; API test checks `/v1/jobs/J-9.jsonld`. |
| 3.4 | Random 128-bit credential IDs; issue with secret key, fetch and revoke | FR-C1, FR-C4 | M | 2 | Implemented. IDs use 16 random bytes; API test fetches the credential after revocation and asserts `revoked`. |
| 3.5 | Accessible `/verify/{id}` page with status, QR alt text and copy link | FR-C3 | M | 2 | Implemented. API and browser tests cover status page, QR name, copy action and 320 px reflow. Manual phone/screen-reader check remains. |
| 3.6 | `<savanna-credential>` summary, copy link and LinkedIn action | FR-C5 | M | 2 | Implemented. The built script-tag bundle registers both elements; `partner-demo.html` exercises it against the local API. |
| 3.7 | Tagged certificate PDF from accessible HTML via headless Chromium | FR-D3, FR-C5 | S | 2 | Implemented. API test checks PDF response and `/StructTreeRoot`. PAC 2024 and veraPDF/PDF-UA-1 verification are still required before claiming full PDF conformance. |
| 3.8 | Open Badges 3.0 JSON-LD, `did:web` and Ed25519 proof | FR-C2 | S | 3 | Hosted verification fallback is implemented and documented. The proof is Ed25519 over canonical JSON, not full RDFC-1.0 Data Integrity; acceptance by an independent Open Badges verifier is not claimed. |
| 3.9 | axe, zoom, keyboard and NVDA tests; Saturday task script | NFR-A | M | 1 | Automated axe, keyboard, zoom, mobile, API, audio-duration and script-tag tests are in place. Human NVDA/TalkBack/co-designer checks are listed in `SATURDAY-TASKS.md` and remain to be recorded. |

## Verification Commands

From the repository root:

```bash
pnpm --filter sandbox-career test
node --test apps/sandbox-career/test/api.node.test.mjs
pnpm --filter sandbox-career build
```

`pnpm --filter sandbox-career test` builds the partner bundle and runs Playwright. PDF
generation additionally requires the Playwright Chromium browser installed.

## Integration Contract

- Host the built `dist/savanna-career.v1.js` as a static ES module.
- Set each element's `api`, `api-key` (publishable only), and `lang` attributes.
- Configure production API CORS for the partner's HTTPS origin, `OPTIONS`, and
  `X-Savanna-Key`.
- Keep secret keys server-side. Never ship them in browser code or query strings.
- Use HTTPS for the host, component asset and API.
