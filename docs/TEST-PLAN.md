# Savanna Access Kit — Verification Plan and Findings

**Last integration pass:** 16 November 2026
**Purpose:** distinguish automated evidence from manual accessibility and content review.

## Scope

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

## Manual verification still required

- Keyboard-only walkthrough across player, captions, transcript, sign window, audio description, offline controls, and Career Gateway; include focus order, visible focus, shortcut conflicts, and focus restoration.
- Screen-reader checks with NVDA/Firefox or Chrome, TalkBack/Chrome on a physical Android device, and VoiceOver/Safari on Apple hardware where supported.
- Actual browser zoom at 200% and 400%, text-spacing overrides, narrow viewport reflow, and touch target checks on devices.
- Contrast measurements for each rendered theme and state, including focus, disabled, live, and error states.
- Service-worker registration and cold reload while offline on a production-like HTTPS origin; storage eviction and low-quota behavior.
- Human review of English and Amharic captions, recorded audio description, and sign-language content. The L-103 sign fixture is a placeholder and is not a substitute for an interpreter-produced track.
- Network throttling and interrupted-connection checks on representative devices. Fixture byte counts are not timing measurements.

## Findings and remediation

Keep dated findings here only when supported by a reproducible run or an attributed, consented participant session. For each issue record the browser/device/assistive technology, exact steps, result, and code or content change. No participant quotes or scores are included because this pass has no verified participant record.
