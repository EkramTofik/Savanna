# @savanna/pipeline: lesson pipeline, front half (task 4.5)

Turns a lesson video into **reviewable English and Amharic WebVTT captions** (SRS section 9, steps 1 to 3).
Owner: Member 4. Folders: `src/ingest/`, `src/transcribe/`. No runtime npm dependencies, only Node 22 and the tools below.

## What it does

| Step | Command | Result |
|---|---|---|
| 1 Ingest | `ingest` | `ingest/video.mp4` (H.264/AAC, web-ready), `ingest/audio.wav` (16 kHz mono for ASR), `ingest/sign.mp4` (30 fps, no audio) and `ingest/ingest.json` (duration, sign offset and duration, warnings) |
| 2 Transcribe | `transcribe` | `transcribe/raw.<lang>.json`, then `captions/<lang>.draft.vtt` |
| 3 Review gate | `review approve` / `review gate` | `captions/<lang>.vtt` exists **only** after a named person approves; `review.json` records who and when |

`run` does steps 1 and 2 in one go. It never publishes: a draft is not a caption until a person has approved it.

## Requirements

- `ffmpeg` and `ffprobe` on PATH (with libx264).
- English ASR: open-source Whisper command line, `pip install openai-whisper` (or set `WHISPER_BIN`).
- Amharic ASR: none is chosen yet on purpose. See "Choosing the Amharic engine" below.

## Quick start

```bash
# from the repo root (see "Wiring" if the root script is not there yet)
pnpm pipeline run --video lesson.mp4 --sign sign.mp4 --lesson L-102 --model small \
                  --am-import my-am-captions.vtt
# edit pipeline-out/L-102/captions/en.draft.vtt (and am.draft.vtt) in any text editor, then:
pnpm pipeline review approve --lesson L-102 --lang en --by "Sara"
pnpm pipeline review approve --lesson L-102 --lang am --by "Abebe"
pnpm pipeline review gate --lesson L-102          # exit code 0 only when en and am are both approved
```

Relative paths are resolved from the folder you typed the command in. Output goes to `pipeline-out/<lessonId>/` (git-ignored); change it with `--out`.

## Cue rules (SRS section 9)

At most **2 lines**, about **32 characters per line**, **1 to 7 seconds** per cue. Characters are counted as people see them, so an Amharic syllable counts as one. The formatter breaks at sentence ends (including `።`), prefers to break lines after commas (`,` `፣`), starts a new cue after a pause of more than 1.2 s, merges or holds a cue that would be shorter than 1 s, and never lets cues overlap or run past the video. Captions are plain text; formatting tags are removed.

`review approve` checks the edited draft with the same rules. **Errors block approval** (not WebVTT, bad or overlapping times, empty cue, more than 2 lines, cue after the end of the video). **Warnings are shown but do not block** (line over 32 characters, cue under 1 s or over 7 s, English text in an Amharic file, or the reverse); add `--strict` to block on warnings too.

## The review gate

- Edit `captions/<lang>.draft.vtt`. Cue numbers are in the file so you can say "cue 12".
- `approve` writes `captions/<lang>.vtt` and stores the SHA-256 of both files in `review.json`.
- `gate` fails if a language is still a draft, **or if either file changed after approval**. Generating a new draft removes the old approval and its published file.
- Required languages default to `en,am`; use `--require en` for a lesson that has no Amharic yet (and say so in the A11Y statement).
- Later steps (pack, PDF, publish) call `assertPublishable(root, lessonId)` from `src/transcribe`. It throws `GateError` with the reasons. `review.json` tracks use the same field names as the `LessonAsset` table (`lang`, `checksum`, `reviewed`), so the publish step can map them directly.

## Choosing the Amharic engine (SRS section 4.1, Appendix B)

Raw Amharic ASR is a draft, never the final caption. Any engine that can write segment JSON can be compared:

```bash
# run each candidate; --candidate keeps drafts and review state untouched
pnpm pipeline transcribe --lesson L-102 --lang am --candidate whisper --model large-v3
pnpm pipeline transcribe --lesson L-102 --lang am --candidate mms \
    --cmd "python3 tools/mms_asr.py --audio {audio} --lang {lang} --out {out}"

# score them against a human-corrected reference (a .vtt, .srt, .json or .txt)
pnpm pipeline eval-asr --lang am --ref reviewed-am.vtt \
    --hyp whisper=pipeline-out/L-102/transcribe/candidates/am.whisper.json \
    --hyp mms=pipeline-out/L-102/transcribe/candidates/am.mms.json --out docs/AMHARIC-ASR-EVAL.md
```

An engine wrapper (`--cmd`) is any program that writes JSON like `{ "segments": [{ "start": 0.0, "end": 2.4, "text": "...", "words": [{ "text": "...", "start": 0.0, "end": 0.4 }] }] }` (`words` is optional; openai-whisper's own JSON works as is). `{audio}`, `{lang}` and `{out}` are filled in; without `{out}` the JSON is read from stdout.

The report gives WER and CER. Letters that sound the same (ሀ ሐ ኀ, ሰ ሠ, አ ዐ, ጸ ፀ) are folded together by default so a spelling choice is not counted as a recognition error; `--no-fold` turns this off. Once an engine is chosen, use it with `transcribe --lang am --cmd "..."`.

## Wiring (two small edits outside this folder)

1. Add to the root `package.json` scripts: `"pipeline": "pnpm --filter @savanna/pipeline cli"`.
2. `packages/*` must be in `pnpm-workspace.yaml` (it already is if `packages/sdk` installs). Then run `pnpm install` once to update `pnpm-lock.yaml`.

## Tests

`pnpm --filter @savanna/pipeline test`. The suite covers the cue limits, WebVTT reading and writing (including Amharic), the review gate, the error rates, the ASR adapters (with a stand-in engine) and a full MP4-to-approved-captions run with real ffmpeg (skipped automatically if ffmpeg is missing).

## Not done here (honest list)

- Not run with real Whisper or a real Amharic engine in this environment, only with a stand-in engine that writes the same JSON. Run it on the real lesson on day 1.
- No Amharic engine has been evaluated yet; the quality of Amharic ASR is unknown until `eval-asr` is run on a human-corrected reference.
- Sign-language video comes from human interpreters (FR-P5); ingest only normalises it and records offset and duration.
