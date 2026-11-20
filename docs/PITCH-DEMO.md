# Pitch-day demonstration script

This is a five-minute script for the hosted Savanna page once the team deploys and records the actual HTTPS frontend/API origins. No hosted URL is configured in this repository today. Do not present the local development page as a hosted demo.

## Before the pitch

- Open the team-provided hosted course page in the target browser and verify L-102/L-103 load from the selected production API.
- Confirm the page URL and API origin are HTTPS, the browser console has no localhost requests, and the service worker controls the page.
- Download one lesson while online, then verify offline playback in a separate browser run. Cache Storage may be cleared by the browser or operating system.
- Keep the limitations ready to say plainly: L-102/L-103 share the same source video; Amharic is awaiting human review; AD and Ethiopian Sign Language are unavailable for these lessons; the credential proof is a prototype.
- No recording backup is committed. Follow `docs/BACKUP-RECORDING.md` and store the resulting recording in the team’s approved location.

## Five-minute walkthrough

| Time | Action and narration |
| --- | --- |
| 0:00–0:35 | From the hosted Savanna course page, open L-102 using its lesson menu link. Point out the selected lesson and explain that only lessons with real fixture routes are linked; unavailable activities remain clearly unavailable. |
| 0:35–1:15 | Start playback, pause, seek, and use the caption control. Switch to Amharic, increase caption size, and switch back. Say that the translated interface/captions pass automated format and behavior checks but are awaiting qualified native-speaker review. |
| 1:15–2:00 | Turn data saver on and explain that video loading is deferred until requested. Open the offline pack control and show its estimated/downloaded size and progress. The current fixture is about 2.03 MiB, not a ≤1 MB low-data pack. |
| 2:00–3:00 | Use Tab and the player shortcuts for one minute: play/pause, captions, language, sign state, AD state, transcript, and a transcript seek. The current lesson honestly reports sign and AD unavailable; do not imply those tracks can be demonstrated. |
| 3:00–3:45 | Ask in English: “What is the main idea of this lesson?” Expected response is a transcript-grounded summary about short online videos and longer lectures. Ask in Amharic: “የዚህ ትምህርት ዋና ሐሳብ ምንድነው?” The fixture test expects an Amharic response describing the speaker’s point. Unsupported questions should receive the not-found response. |
| 3:45–4:30 | Move to the transcript and seek using a transcript line. Show the missing-media message for sign/AD rather than enabling test fixtures. Explain that `ad.opus`, `ad.vtt`, and `esl-placeholder.mp4` are test/demo assets excluded from production media. |
| 4:30–5:00 | Summarize offline and keyboard behavior, then state the unreviewed Amharic and absent production sign/AD media honestly. Close with the next production work: rights confirmation, native-speaker review, interpreter recording, AD recording, and deployment smoke test. |

## Keyboard shortcut reminder

Open the player’s `?` shortcut dialog during preparation. The visible dialog is authoritative for the build being demonstrated; it lists play/pause, seek, volume, mute, captions, sign window, audio description, fullscreen, help, start/end, transcript and preferences. Avoid promising that every action in the one-minute pitch sequence has a single combined end-to-end automation test.

The repository’s rule-based Q&A is limited to known lesson prompts and fixture content; it is not a general question-answering system and does not call an external model. A passing fixture test is not a claim of Amharic review.
