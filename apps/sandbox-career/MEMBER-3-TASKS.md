# Member 3: Career Gateway — corrected task list

Corrected against **Savanna Access Kit SRS v1.0 §5.4** (Career gateway) and the API table (§8).
This replaces the "7. Member 3: Career Gateway" section of the Task Delegation Plan.

Task IDs are unchanged, so existing cross-references stay valid:
the Saturday split ("tasks 1.9, 2.8, 3.9") and the cut line ("3.8 first, then 3.7").

## Fixes applied vs the plan

1. **Added FR-J5** ("Accessible apply path"). The plan claimed `FR-J1 to J5` in the mission but no task delivered J5.
2. **3.1** now lists FR-J1's explicit fields and adds FR-J3's WCAG 1.4.4 / 1.4.10 / 1.4.12 clause.
3. **3.3** now pins the three job endpoints and FR-J4's required JSON-LD members.
4. **3.5** now states `valid / revoked / expired` and the `Accept: application/ld+json` branch (FR-C3).
5. **3.8** now states the pseudonymous recipient id (never a raw email) and `validFrom` (FR-C2).
6. Member-3 "Delivers" line gains *accessible apply page*.

## Mission

The job card and verifiable certificate, front to back.
SRS refs: **FR-J1 to J5, FR-C1 to C5, FR-D3** (certificate PDF only).
Sandbox: `apps/sandbox-career/` using the mock server for the UI and a local harness for the API routes.
No part of this stream needs the player or lesson content.

## Tasks

| ID | Task | SRS | Pri | Pts | Done when |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `<savanna-job-card>`: semantic markup (`<article>`, heading, `<dl>` facts) showing title, employer, location/remote, pay (if given), deadline, key requirements and an Apply link; single-column reflow; 44 px targets; tolerates text-spacing overrides | J1, J3 | M | 3 | Passes 200% and 400% zoom and a 320 px viewport with no horizontal scroll and no clipped text (WCAG 1.4.4, 1.4.10, 1.4.12) |
| 3.2 | Audio summary: play and stop buttons, transcript below, no autoplay; script that renders 20 to 30 s EN/AM audio per job | J2 | M | 2 | Screen reader user can play and read it; audio never autoplays |
| 3.3 | Jobs API: Prisma `career.prisma`, `routes/jobs.ts`, seed jobs; `GET /v1/jobs`, `/v1/jobs/{id}`, `/v1/jobs/{id}.jsonld` emitting `schema.org/JobPosting` with `jobLocationType`, `employmentType`, `validThrough` and the accessibility note in `description` | J4 | M | 2 | `GET /v1/jobs/{id}.jsonld` validates in a JobPosting checker |
| 3.4 | Credentials API: unguessable ids (UUIDv7 or 128-bit random), issue (secret key), fetch as JSON-LD, revoke via status endpoint | C1, C4 | M | 2 | Revoked credential shows as revoked immediately |
| 3.5 | Verify page: accessible HTML at `/verify/{id}` (name, achievement, date, status `valid`/`revoked`/`expired`); `Accept: application/ld+json` returns the credential JSON; QR code with alt text; copy-link button | C3 | M | 2 | Opens and reads correctly on a phone and with a screen reader; JSON-LD branch verified with `curl -H "Accept: application/ld+json"` |
| 3.6 | `<savanna-credential>` component: summary, copy link, LinkedIn add URL, tagged PDF link | C5 | M | 2 | Works from a script tag on a plain page |
| 3.7 | Certificate PDF: tagged PDF via headless Chromium from an accessible HTML template (document title, language, bookmarks, reading order) | D3, C5 | S | 2 | PAC 2024 and veraPDF PDF/UA-1 pass; NVDA reads it in order |
| 3.8 | Open Badges 3.0: `OpenBadgeCredential` JSON-LD with issuer, pseudonymous recipient id (never a raw email), achievement, `validFrom` and an Ed25519 Data Integrity proof; issuer published via `did:web` + `/.well-known/did.json` | C2 | S | 3 | Verifier accepts a sample. If not done, ship hosted verification and say so in docs |
| 3.9 | Own tests: axe, zoom, keyboard, NVDA; write the Saturday task script for job and certificate tasks | NFR-A | M | 1 | Zero axe violations; script handed to Member 4 |
| 3.10 | Accessible apply path: the Apply link opens an accessible form (visible labels, error summary, no timeouts; any time limit can be extended, WCAG 2.2.1) | J5 | M | 2 | A keyboard-only and screen-reader user can complete and submit the form unaided |

**Cut line:** 3.8 first, then 3.7.

## Notes / not changed

- The SRS **§11** team split says member 3 = *"API, pipeline, credentials"* and member 4 = *"job card, docs…"*. That is **not** applied here: this plan deliberately rebalances the split into four end-to-end slices, and the Career Gateway slice owns the job card. Flag it to the team if the §11 split is meant to be authoritative.
- `credential.expired` is represented as a derived status (from `expiresAt`), not a stored value; FR-C3 only requires the page to show it.
