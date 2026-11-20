# Ethiopian Sign Language recording requirements

**Status: no verified Ethiopian Sign Language recording is present.** `contracts/fixtures/media/esl-placeholder.mp4` is a placeholder and must never be attached to a lesson or described as Ethiopian Sign Language.

## Recording brief

- Commission a Deaf-community-reviewed Ethiopian Sign Language interpretation of the locked English lesson, with a qualified Ethiopian Sign Language interpreter and an authorized language reviewer.
- Record the complete lesson continuously so each sign remains synchronized to the spoken lesson. Deliver the original camera file and a browser-ready MP4 encoded with H.264 video. Keep the interpreter's hands, face, and upper body visible against uncluttered, high-contrast lighting; frame the signer in landscape 16:9 so the existing responsive overlay can be resized without cropping signs.
- Include no unrelated footage, ASL, generic gestures, or unreviewed signs. Record the language, dialect/variety if relevant, interpreter, reviewer, consent, and the date in the production record.
- Measure the exported clip's duration and its start offset from the lesson master. Never estimate `offsetMs` from the script.
- Provide a contextual language label for the learner. The integration accepts an optional `languageName` field; use `Ethiopian Sign Language` only after the recording has been verified. The player's existing EN/Amharic captions remain separate from the sign video.

## Integration contract

Add the signed video only after review by setting the lesson's `sign` object to the recorded asset URL, measured `offsetMs`, and verified `languageName`. Serve the URL from the lesson page's same origin (for example, `/media/L-104/sign-esl.mp4`) so the page's service worker can cache and replay it. HTTPS alone does not let a page's service worker intercept a cross-origin video. The current `<savanna-sign-window>` fetches the video, follows the player time and playback rate, and supplies keyboard and pointer controls.

If a recording is not approved, keep `sign: null`. The player will retain its accessible unavailable message, and the offline pack builder will omit the sign file. The current contract has no separate sign-track caption URL; keep the language name and surrounding lesson captions as contextual information rather than inventing a caption asset.

## Acceptance checks before publication

- Verify the signed interpretation against the final lesson cut from beginning to end, including seeks and playback-rate changes.
- Confirm the label names Ethiopian Sign Language and the recording's provenance has been approved.
- Check keyboard focus, Enter/Space toggle, arrow-key movement, resize handles, touch layout, reduced-motion behavior, and visible controls at mobile and desktop widths.
- Add the actual asset's size and SHA-256 to the offline pack manifest. Confirm the file downloads and plays from Cache Storage while offline.
- Keep the lesson's `sign` field null until every check is complete.
