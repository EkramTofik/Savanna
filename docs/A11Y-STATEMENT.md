# Accessibility and language status

Enkopa is an accessibility prototype. This statement records repository evidence; it is not a WCAG conformance certification or a report of user research.

## Verified in this checkout

- The player includes keyboard-accessible controls, caption settings, transcript controls, language switching, a sign-window component, audio-description component, and offline pack controls.
- Automated Node tests exercise component semantics, keyboard affordances, null/missing media states, cue and offset synchronization, offline caching, integrity checks, and English/Amharic Q&A fixtures.
- The current local Playwright player suite passed 18/18 cases, including axe scans, small viewports, zoom, forced colors, reduced motion, keyboard-only controls, captions, offline save/replay, sign-unavailable and AD-unavailable states. This is browser automation, not learner/user research.
- L-102/L-103 provide sample English and Amharic captions. Tests check format, timing and content fixtures; they do not establish translation quality.
- Missing sign and AD assets remain unavailable in the L-102/L-103 manifest. The controls expose an unavailable state instead of claiming media exists.

## Not verified / requires people or production infrastructure

- No documented testing with disabled learners, Ethiopian learners, screen-reader users, or other representative users has been supplied.
- No qualified native Amharic speaker has approved the interface strings, lesson captions, transcripts, Q&A, errors, downloads, or lesson translation. All Amharic remains draft pending review; see `docs/production/AMHARIC_REVIEW_CHECKLIST.md`.
- No verified Ethiopian Sign Language recording exists in the lesson manifests. The checked-in sign clip is a placeholder, is not ESL content, and is excluded from lesson manifests and the static production package.
- No approved production audio-description recording and cue file is attached to L-102/L-103. The standalone AD fixtures are demo assets.
- No production hostname, hosting account, production database or production accessibility smoke test is configured.
- Automated axe checks do not prove screen-reader usability, focus contrast in every host theme, WCAG conformance, or a successful real keyboard-only pitch run.

Do not describe the prototype as fully accessible or claim native-speaker, interpreter, disabled-user, or WCAG approval without dated evidence from those reviewers and tests.
