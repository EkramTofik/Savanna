# Amharic review checklist

**Review status: pending.** No qualified Amharic speaker has approved the repository translations. The Ethiopic text remains draft copy; this checklist is a complete review handoff, not an approval record. Re-run the repository scan for Ethiopic characters before each release and add any newly introduced source files here.

## Product content to review

| Review area | Sources that contain learner-facing Amharic | Review status |
| --- | --- | --- |
| Player interface, captions settings, language selection, errors, announcements, transcript labels, and transcript downloads | `module/src/player/i18n/am.json`, `module/src/player/i18n/en.json`, `module/src/player/savanna-player.ts`, `module/src/player/transcript-manager.ts` | Pending |
| Lesson titles, summaries, and learner content | `contracts/fixtures/v1/lessons/L-102.json`, `L-103.json`; `contracts/fixtures/v1/lessons/L-102/transcript.json`, `L-103/transcript.json`; `module/src/player/lesson-qa.ts` | Pending |
| Timed Amharic captions | `contracts/fixtures/media/am.vtt` (used by L-102 and L-103); future L-104 `am.vtt` only after translation and timing review | Pending native-speaker and audio review |
| Offline download controls, progress, success, missing-track, retry, cancel, and storage messages | `module/src/offline/offline.ts` | Pending |
| Sign-window labels and unavailable-media fallback | `module/src/sign-window/sign-window.ts` | Pending; no Ethiopian Sign Language recording is present |
| Job cards, employment labels, summaries, and spoken-summary transcript | `module/src/job-card/i18n/am.json`, `module/src/job-card/job-card.ts`, `contracts/fixtures/v1/jobs/J-9.json`, `J-10.json`, `savanna/pages/data/jobs.json` | Pending |
| Credential labels, issuer name, verification result, PDF text, and errors | `module/src/credential/i18n/am.json`, `module/src/credential/credential.ts`, `contracts/fixtures/v1/credentials/C-7.json`, `api/src/routes/member3-amharic.json`, `api/src/routes/credential-pdf.ts`, `api/src/routes/member3-verify.ts`, `api/src/routes/open-badges.ts`, `api/src/routes/verify.ts` | Pending |
| L-104 English-to-Amharic lesson translation | `docs/production/L-104-digital-learning-safety.md` | Working translation; pending qualified human review |
| Standalone and partner demos, including captions editor, player, sign-window, job, and credential copy | `demo/blank.html`, `demo/sandbox-player/index.html`, `demo/sandbox-player/src/main.ts`, `demo/sandbox-media/index.html`, `demo/sandbox-media/standalone.html`, `demo/sandbox-career/index.html`, `demo/sandbox-career/partner-demo.html`, `demo/sandbox-career/src/main.ts`, `demo/sandbox-career/harness/apply-form.ts`, `demo/sandbox-career/harness/qr.mjs`, `demo/sandbox-career/harness/server.mjs`, `demo/sandbox-career/harness/server.ts`, `demo/sandbox-career/scripts/render-audio-google.mjs`, `demo/caption-editor/index.html`, `savanna/pages/jobs.html`, `savanna/pages/data/jobs.json` | Pending |
| Braille rendering of Ethiopic text | `module/src/player/braille-formatter.ts` | Pending review by an Amharic/Braille specialist; this is a transliteration map, not a prose translation |

## Generated copies and supporting copy

Review source files first. After corrections are approved, rebuild and compare the generated copies so they match the reviewed source:

- `module/src/job-card/job-card.ce.js`, `module/src/credential/credential.ce.js`
- `savanna/module/savanna-access.v1.js`, `savanna/module/savanna-career.v1.js`

Also inspect Amharic in caption-generation and evaluation output (`pipeline/src/transcribe/eval.ts`, `pipeline/src/transcribe/text.ts`), prototype documentation (`README.md`, `CONFORMANCE.md`, `pipeline/README.md`), and any newly added UI or generated output. To find source files containing Ethiopic text, run `rg -l --glob '!node_modules/**' --glob '!dist/**' --glob '!.git/**' --glob '!*.map' '\p{Script=Ethiopic}' .` and reconcile new user-visible sources with this table. Amharic strings in automated tests are fixtures or expected values; keep them aligned with reviewed content, but do not treat test success or character-presence checks as language approval.

## Reviewer checklist

- [ ] Record the reviewer’s name, qualifications, review date, and exact files or caption cue ranges reviewed. A repository author’s review is not a substitute for qualified human approval.
- [ ] Check Ethiopic character integrity, spelling, punctuation, sentence order, agreement, and natural phrasing. Flag literal or machine-like translation.
- [ ] Confirm that player labels, language selection, keyboard announcements, errors, download messages, and fallback text are understandable in context and fit the controls they describe.
- [ ] Compare every lesson title, summary, transcript, Q&A response, and caption with its English source. Confirm the Amharic adds no unsupported claim and preserves the strength of safety advice.
- [ ] Agree and apply a glossary for “one-time code,” “password,” “course link,” “captions,” “transcript,” “mobile data,” “trusted source,” and accessibility terms.
- [ ] Listen to the locked recording while reviewing each caption cue. Check meaning, timing, readable line breaks, and cue end time against measured media duration. Do not approve timings against a script alone.
- [ ] Review screen-reader names, bidirectional text, Ethiopic numbers, dates, times, abbreviations, and mixed English/Amharic labels in the actual interface.
- [ ] Review job and credential claims against their source records. Verify Amharic text-to-speech audio against its transcript if that audio is used.
- [ ] For braille output, involve a reviewer qualified in the relevant Amharic braille convention; do not infer accuracy from character coverage alone.
- [ ] Return corrected source strings and VTT files with a dated approval record. Re-run character, schema, timing, generated-bundle, and checksum checks after edits.

Until a qualified reviewer signs off, describe translations as drafts in the pitch and application. UTF-8 integrity, schema validation, caption timing, and passing tests do not establish linguistic approval.
