# Lesson content sources and rights record

This file is a rights/provenance handoff. A file existing in the repository does not by itself establish that it is original, licensed, or approved for public distribution.

| Asset/content | Current repository evidence | Rights/review status | Next action before public hosting |
| --- | --- | --- | --- |
| L-102/L-103 spoken lesson and video (`contracts/fixtures/media/lesson.mp4`) | Both manifests point to the same 120-second fixture. No author, source URL, release, license, or editable project is recorded in the manifests or production docs. | Provenance and redistribution rights not established by this repository. | Team member responsible for the asset must identify the creator/source, confirm rights for public hosting and offline copying, record the evidence, and retain the final master/project. |
| L-102/L-103 English captions, Amharic captions and transcripts | Tracked under `contracts/fixtures/media/{en,am}.vtt` and `contracts/fixtures/v1/lessons/L-10{2,3}/transcript.json`. Integrity and timing are covered by automated tests. | Human linguistic approval is not recorded; Amharic review remains pending in `docs/production/AMHARIC_REVIEW_CHECKLIST.md`. | Have a qualified Amharic speaker compare every cue and transcript against the locked recording; add reviewer/date and approved file hashes. |
| L-104 script | `docs/production/L-104-digital-learning-safety.md` contains an English script and a working Amharic translation. | Draft; no recorded media, licensed source record, measured runtime, timed captions, approved AD, or pack. | Confirm script authorship and rights; commission recording, translation review and accessibility production before creating a lesson manifest. |
| Audio-description sample | `contracts/fixtures/media/ad.opus` and `ad.vtt`. | Test/demo fixture only. No production approval, actor/voice release, or lesson association. | Do not publish as lesson content. For L-104, write and review cues against locked video, record narration with permission, and check timing and file hashes. |
| Sign-window placeholder | `contracts/fixtures/media/esl-placeholder.mp4`. | Explicit placeholder/test fixture; not Ethiopian Sign Language. | Do not ship as lesson media or label it ESL. Follow `docs/ESL-WORKFLOW.md` to commission and verify real interpreter media. |

## Recording a new demo lesson

No L-DEMO recording or source package has been created in this repository. Do not derive one by stretching or relabeling the existing video. Before production, choose an original script or a source with a documented license that permits modification, narration, captioning, public hosting and offline redistribution. Record the source and license URL or signed permission here, along with the media creator, export date, and final hashes. Then measure the locked export and build all synchronized lesson assets from that master.
