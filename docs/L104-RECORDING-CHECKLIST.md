# L-104 recording and ingest checklist

Use this checklist for the real 120–180 second English lesson recording. The current L-104 script and Amharic translation are drafts. Generated caption timestamps are provisional timing guides, not reviewed captions.

## Before recording

- Lock the English script in `docs/production/L-104-digital-learning-safety.md` and confirm the final wording with the lesson owner.
- Record an original screen-and-voice lesson using fictional school names, URLs, accounts, and messages. Obtain consent/releases for every person and location shown.
- Export an MP4 with H.264 video and AAC audio. The embedded AAC track must contain the English narration that should play with the video. Recommended delivery: 1280×720, 25 or 30 fps, video around 1.5–2.5 Mbps, AAC stereo at 96–128 kbps. Keep the cut between 120 and 180 seconds.
- Keep the editable project and locked master in the team’s approved production storage; do not commit private/raw material without rights approval.
- If a separate narration master is delivered, ensure it is 120–180 seconds and aligned to the picture within two seconds. The ingest command compresses this as the offline Opus companion; the separate file does not replace the MP4's audible AAC track.

## Ingest

1. Install FFmpeg and FFprobe on the recording workstation and confirm both are on `PATH` (`ffmpeg -version`, `ffprobe -version`).
2. Put the approved MP4 wherever convenient; a separate aligned narration master is optional.
3. From the repository root, run:

   ```powershell
   pnpm l104:ingest --video "C:\path\to\L-104.mp4"
   ```

   With separate narration audio:

   ```powershell
   pnpm l104:ingest --video "C:\path\to\L-104.mp4" --audio "C:\path\to\L-104-narration.wav"
   ```

The ingest command rejects durations outside 120–180 seconds, requires H.264 video and embedded AAC narration, extracts mono 16 kbps Opus, creates English WebVTT timing drafts from the current script, writes a transcript, calculates byte sizes and SHA-256 checksums, creates the pack ZIP, and publishes the L-104 fixture manifest last. It does not generate Amharic captions because the current translation has not been approved. It leaves sign and audio description null.

## Review before a demonstration

- Open L-104 in the player only after ingest completes. Check that the reported duration and all media play in the target browser.
- The generated English VTT includes a `NOTE` marking it `reviewed=false`; compare every cue to the locked recording, correct wording and timing in an editor, and rerun validation. Do not call draft timestamps approved.
- Have a qualified Amharic reviewer approve the translation before producing/timing `am.vtt`.
- Commission and verify separate audio-description and Ethiopian Sign Language recordings before adding those tracks. Record measured offsets against the final locked picture and obtain the required human review.
- Test the manifest, captions, checksums, pack download, offline playback, keyboard operation, and captions in the deployed host environment before the pitch.

The recording, caption timing/review, Amharic review, AD recording/review, sign-language recording/review, licensing, and hosted smoke test are external production work. This repository contains no generated or approved L-104 media until the command succeeds on a real recording.
