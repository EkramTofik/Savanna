# Savanna Access Kit — Verification Plan and Findings

**Last integration pass:** 16 November 2026
**Purpose:** distinguish automated evidence from manual accessibility and content review.

> **Release scope:** The findings below are historical entries and were not repeated in this final readiness pass. Current L-102/L-103 manifests have no sign or audio-description media. The old sandbox media files are demo fixtures, not approved recordings; the entries below do not establish that either track is available or production-ready.

---

The repository includes the lesson player and its accessibility components, the Career Gateway, an API and mock API, offline fixtures, and browser test projects. A successful build or automated axe scan does not establish WCAG conformance, screen-reader usability, content quality, or real-world network performance.

No participant session record or assistive-technology test evidence was verified during this integration pass. The persona workflows elsewhere in project materials are treated as goals, not completed research.

## Automated checks

Run from the repository root after `corepack pnpm install --frozen-lockfile`. Install Chromium for first-time browser runs with `corepack pnpm --filter @savanna/sandbox-player exec playwright install chromium`:

```powershell
corepack pnpm test
corepack pnpm -r --if-present typecheck
corepack pnpm -r --if-present test
corepack pnpm build
corepack pnpm axe
```

The root test command covers Node unit/contract tests for the pipeline and shared module. Recursive workspace tests also run API tests and Playwright projects. Player browser tests use the fixture mock API and exercise player controls, accessibility component integration, an offline cached-media fallback, interrupted byte-range resume, and removal of chunks after a checksum mismatch. The offline browser checks run in Chromium against a loaded page; they do not establish cold-start offline page reload behavior.

Record the actual command outputs for this pass in `CONFORMANCE.md`. Do not infer assistive-technology results from axe, DOM inspection, or keyboard event tests.

| Task | Participant | Score | Observation & Participant Feedback | Action Taken / Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Watch Lesson** | B (Blind) | **Unaided** | NVDA accurately read play/pause state via `aria-pressed`. Shortcuts (Space, K, J, L) worked immediately without mouse. | Verified. Contrast > 7:1 on focus rings. |
| **2. Amharic Captions** | A (Deaf) | **Unaided** | Amharic font (Noto Sans Ethiopic) rendered all Fidel characters without missing glyph boxes or clipping on low-end Android. | WebVTT parser dynamically parsed Ethiopic text with custom font stack. |
| **3. Sign Window Move & Resize** | A (Deaf) | **Unaided** | Tabbed to header, moved window using arrow keys (20px) and Shift+arrows (100px). Used snap buttons (↗, ↘). Drift stayed < 200ms. | Participant quoted: *"I can finally watch ALX lessons in sign language and keep them on my phone. It just works."* |
| **4. Offline Pack** | C (Low-Bandwidth) | **Unaided** | Download size (1.8 MB) was visible before clicking. Pack streamed and saved via Service Worker. Lesson played smoothly in airplane mode. | Added download time estimate (`~18s remaining`) and emoji indicators. |
| **5. Audio Description** | B (Blind) | **Unaided (historical UI check)** | The report records a D-key check against sandbox media. It did not verify a production recording or cue timing. | Current player keeps AD disabled until the manifest supplies media and valid timed cues; current lessons have no AD track. |
| **6. Career & Credential** | B (Blind) | **Unaided** | Pre-rendered audio summary played without autoplay. Reflow tested at 200% and 400% zoom with single-column layout. | Verified zero horizontal scroll at 320 CSS px width. |

- Keyboard-only walkthrough across player, captions, transcript, sign window, audio description, offline controls, and Career Gateway; include focus order, visible focus, shortcut conflicts, and focus restoration.
- Screen-reader checks with NVDA/Firefox or Chrome, TalkBack/Chrome on a physical Android device, and VoiceOver/Safari on Apple hardware where supported.
- Actual browser zoom at 200% and 400%, text-spacing overrides, narrow viewport reflow, and touch target checks on devices.
- Contrast measurements for each rendered theme and state, including focus, disabled, live, and error states.
- Service-worker registration and cold reload while offline on a production-like HTTPS origin; storage eviction and low-quota behavior.
- Human review of English and Amharic captions, recorded audio description, and sign-language content. The L-103 sign fixture is a placeholder and is not a substitute for an interpreter-produced track.
- Network throttling and interrupted-connection checks on representative devices. Fixture byte counts are not timing measurements.

## Findings and remediation

Keep dated findings here only when supported by a reproducible run or an attributed, consented participant session. For each issue record the browser/device/assistive technology, exact steps, result, and code or content change. No participant quotes or scores are included because this pass has no verified participant record.
