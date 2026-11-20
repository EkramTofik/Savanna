# Ethiopian Sign Language recording and integration workflow

**Current status: not available in the published lesson manifests.** The repository has no verified Ethiopian Sign Language recording. `contracts/fixtures/media/esl-placeholder.mp4` is a test placeholder and must not be labeled, shown, or shipped as Ethiopian Sign Language.

## Commission and record

1. Select the locked lesson master and provide it to a qualified Ethiopian Sign Language interpreter. Agree on the language variety and review process with Deaf community representatives or an authorized reviewer.
2. Obtain written interpreter/reviewer consent covering recording, editing, public hosting, captioned lesson use, and offline copying. Record names/roles, review date, language variety, and consent reference in the production record.
3. Record the complete interpretation against the final lesson cut. Keep the interpreter’s face, hands and upper body visible, use stable high-contrast lighting and an uncluttered background, and frame wide enough for the responsive overlay. Do not substitute ASL, generic gestures, AI-generated signing, or footage of an unverified signer.
4. Export the reviewed clip as H.264 MP4. Preserve camera original and project file. Name the production asset `sign-esl.mp4` under the lesson’s media directory; do not overwrite `esl-placeholder.mp4`.
5. Measure the lesson master and sign clip durations and the actual start offset with the editor or media inspection tool. Record the measured integer offset in milliseconds as `offsetMs`; never estimate it from the script.

## Integrate only after review

Add the asset to a lesson’s `sign` object only after the interpretation is approved. Use a same-origin URL such as `/media/L-104/sign-esl.mp4` so the current service worker can cache it. Set `languageName` to `Ethiopian Sign Language` only after the language and interpretation have been verified. Calculate the exact byte size and SHA-256 from the final export and include both in its offline pack entry.

Run the sign-window tests and the browser player suite. Check loading and missing-media errors, offset sync after play/pause/seek/rate changes, keyboard toggle and movement, focus indication, resize controls, mobile layout, and offline playback after saving the pack. Confirm that the clip remains intelligible at each supported viewport. Preserve `sign: null` if any production or technical check is incomplete.

The current contract has no separate sign-track caption field. Do not claim captions for the sign video unless the contract and player have been deliberately extended and separately tested.
