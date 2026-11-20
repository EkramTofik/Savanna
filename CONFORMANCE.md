# Accessibility status for the pitch demo

**This is not a WCAG conformance report or an independent accessibility audit.** This repository does not contain evidence for product-level conformance, screen-reader validation, or approval by learners or language communities. Do not present the demo as certified or fully accessible.

## Current lesson media

- L-102 and L-103 contain video/audio fixtures and English and Amharic caption tracks. Both lesson records set `sign` and `audioDescription` to `null`; neither Ethiopian Sign Language nor audio description is available for these lessons.
- `contracts/fixtures/media/ad.opus` and `ad.vtt` are component-test/demo fixtures only. They are not approved lesson media and are not referenced by either lesson's manifest or offline pack.
- `contracts/fixtures/media/esl-placeholder.mp4` is a placeholder fixture, not Ethiopian Sign Language. It is not referenced by a lesson manifest or offline pack.
- L-104 is a script and production plan. It has no player/API manifest or recorded media.

The player should continue to show the unavailable state until genuine media and valid timing are delivered and reviewed. Never describe the isolated AD fixtures or sign placeholder as playable accessibility content.

## What automated checks establish

The repository includes targeted tests for selected player, caption, keyboard-control, audio-description cue/synchronization logic, sign-window behavior, and offline-pack behavior. The tests exercise code paths and fixtures. They do not establish that an actual lesson has an AD recording or Ethiopian Sign Language video, that a real recording is synchronized correctly, or that a learner can use the deployed application with assistive technology.

Amharic schema, Unicode-integrity, caption-timing, and Q&A fixture checks can detect selected structural and behavioral errors. They cannot assess translation accuracy, natural phrasing, terminology, or suitability for local learners.

## Human review still required

- Test the deployed build with keyboard-only use and relevant screen readers on the target browsers and devices; record the environment, tasks, results, and defects.
- Ask qualified Amharic reviewers to compare all user-facing text, lesson content, and timed captions with the English source and approve corrected files. No native-speaker approval is recorded here.
- Commission and review genuine Ethiopian Sign Language media with qualified interpreters and Deaf-community reviewers before setting a lesson's `sign` field.
- Record and review audio description against a locked lesson cut, create valid timed cues, measure the offset, and test playback before setting `audioDescription`.
- Reassess the complete hosted product against the applicable accessibility requirements. Automated tests alone are insufficient for a conformance claim.
