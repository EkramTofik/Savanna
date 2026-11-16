# Accessibility and Integration Verification Report

**Product:** Savanna Access Kit
**Evaluation date:** 16 November 2026
**Scope:** Repository integration and automated checks run in this workspace.

## Status

**WCAG 2.2 AA conformance has not been established.** Automated tests and axe scans found and helped fix issues, but this pass did not include a complete manual audit, assistive-technology testing, or participant testing. The findings below describe only checks that were actually run.

## Automated evidence

| Check | Result | Evidence and limits |
|---|---|---|
| Root unit and contract suite: `corepack pnpm test` | Pass — 60 tests | Node tests for shared components, contracts, and pipeline utilities. |
| Recursive TypeScript checks: `corepack pnpm -r --if-present typecheck` | Pass | API, Career Gateway, pipeline, module, and SDK workspaces. |
| API workspace tests | Pass — 60 tests | Vitest route, fixture, and integration tests, including configured pack-root resolution. |
| Pipeline workspace tests | Pass — 73; skipped — 7 | Vitest. Skipped tests were reported by the runner and remain skipped. |
| Career Gateway browser suite | Pass — 15 tests | Chromium/Playwright: axe, narrow reflow, keyboard actions, language behavior, audio duration, and partner-host integration. The 200%/400% checks use equivalent viewport widths, not actual browser zoom. |
| Player browser suite | Pass — 15 tests | Chromium/Playwright: player integration, component interactions, axe, narrow reflow, forced colors, reduced motion, cached-media fallback, cold offline reload, interrupted/resumed range download, and checksum-mismatch cleanup. |
| Production build | Pass | `tsx build-components.mjs` built unified and modular component bundles and the Career Gateway bundle. Vite production builds for both sandbox-player and sandbox-career also passed. |
| Standalone axe audit | Pass — zero violations | The blank demo, caption editor, and integrated Savanna lesson page all had zero axe violations after correcting heading levels and adding banner/navigation landmarks. |
| Prettier check | Pass for changed code files | Prettier formatted and verified the changed JavaScript/TypeScript test, service-worker, and Vite configuration files. The legacy integrated HTML page was not run through whole-file formatting. |
| Package install | Blocked | `corepack pnpm install --frozen-lockfile` could not fetch pinned pnpm 9.15.0 because registry DNS resolution failed (`ENOTFOUND registry.npmjs.org`). Tests used dependencies already present in the workspace. |
| Lint | Not configured | No workspace defines a lint script, so there is no project lint command to run. |
| Docker Compose | Configuration pass; image build unavailable | `docker compose config` succeeded. The Docker Desktop Linux engine is unavailable in this environment, so image build/run was not verified. |

The player Playwright axe scans passed after the offline button's accessible name was changed to match its visible label. The API pack tests verify the fixture index's declared byte totals and SHA-256 formatting; browser tests verify cold offline reload, resumed byte ranges, and cleanup after a checksum mismatch.

The CI workflow was reviewed but not run on GitHub. No workspace currently defines a `lint` script; the workflow's `--if-present lint` step therefore has no lint command to execute.

## Manual checks still required

- Full keyboard-only workflows and focus behavior across all components and host pages.
- Screen-reader operation with NVDA, TalkBack, and VoiceOver on supported browser/device combinations. DOM semantics and live-region tests are not screen-reader testing.
- Actual browser zoom at 200% and 400%, text-spacing overrides, and device-level reflow/touch checks.
- Contrast measurements across rendered themes, focus, disabled, loading, and error states.
- Offline reload on the actual HTTPS deployment, plus low-quota and storage-eviction scenarios. The cold reload regression was automated on localhost, which qualifies as a secure context.
- Human language and accessibility review of captions, audio description, and sign media. The L-103 sign video is a placeholder fixture.
- Production network performance, deployment security/privacy review, and load testing.
- WCAG criterion-by-criterion review of the Career Gateway and host platform shell.

No participant scores, quotes, device tests, or user-research outcomes are claimed by this report. See [the verification plan](docs/TEST-PLAN.md) for the reproducible manual checklist.
