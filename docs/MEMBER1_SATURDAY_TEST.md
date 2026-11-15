# Member 1: Player Experience - Saturday Accessibility Test Plan

**Document:** Saturday Verification Runbook & Testing Script (Task 1.9, NFR-A)  
**Stream:** Member 1 - Player Experience (`<savanna-player>`)  
**Target Audience:** Co-designers with disabilities, Accessibility Observers, Member 4 (Test Coordinator)  

---

## 1. Automated Baseline

Run the automated verification suite from the repository root before the testing session:

```bash
# 1. Ensure dependencies and browser are installed
pnpm install --frozen-lockfile
pnpm --filter @savanna/sandbox-player exec playwright install chromium

# 2. Run Member 1 Playwright & Axe-Core test suite
pnpm --filter @savanna/sandbox-player test
```

**Expected Baseline Outcome:**
- 10/10 automated tests pass.
- Zero critical, serious, moderate, or minor axe-core accessibility violations.
- 320 CSS px viewport reflow has 0 horizontal scroll.
- Forced-colors (high contrast) and reduced-motion modes pass cleanly.

---

## 2. Test Setup & Session Protocol

### Test Environment
* **Sandbox URL:** `http://localhost:5173/` (or production demo URL provided by Member 4)
* **API Fixture Server:** `http://localhost:4010` (mock server)
* **Assistive Technologies Tested:**
  * **Desktop:** NVDA + Google Chrome / Mozilla Firefox, JAWS, Windows High Contrast Mode (`Alt + Left Shift + PrintScreen`).
  * **Mobile:** TalkBack on Android 8+ (Chrome), iOS VoiceOver (Safari).
  * **Visual Magnification:** Browser zoom at 200% and 400%, OS screen magnifier.

### Testing Protocol with Co-Designers
1. **Consent & Context:** Explain clearly that we are testing the accessibility of the software, *never the person*. Offer regular breaks.
2. **Bring Your Own Device:** Let co-designers use their own preferred assistive technology, speech synthesizer, refreshable Braille display, and keyboard/mouse settings. Do not change their setup.
3. **Tasks, Not Instructions:** Give only the end goal (e.g., *"Watch the lesson"*). Do not give prescriptive steps like *"Click the button with the gear icon"*.
4. **Silent Observation:** Observers must remain silent while the user works. Record timestamps, stumbling blocks, confusion, and direct quotes. For Deaf participants, ensure an Ethiopian Sign Language (ESL) interpreter is present with written prompts.
5. **Score Each Task:** Mark each task as:
   * **Completed Unaided (Pass)**
   * **Completed With Help**
   * **Failed**
6. **Success Metric:** At least 5 of 6 tasks completed unaided per persona. Top 3 severity issues must be triaged and fixed the same day.

---

## 3. Co-Designer Tasks (Give Only the Goal)

### Task 1: "Watch the lesson."
* **Target Personas:** Blind learner, Low-vision learner, Motor-impaired learner.
* **Goal given to tester:** *"Find the video lesson and watch it using your normal navigation methods."*
* **What to observe:**
  * [ ] Can the user navigate to `<savanna-player>` without a mouse (keyboard Tab / screen reader virtual cursor)?
  * [ ] Is the focus indicator clearly visible on every button with high contrast ($\ge 3:1$)?
  * [ ] Does pressing `Space` or `K` start and pause video playback reliably?
  * [ ] Do forward/rewind shortcuts (`J`/`L` for 10s, `Left`/`Right` for 5s) announce time position politely via the screen reader live region?
  * [ ] Are screen reader labels announced in the active UI language?
* **Success Criteria (Member 1 verification):**
  * User plays, pauses, and seeks the video unaided.
  * Screen reader announces video status and position (e.g., *"Playing"*, *"Position 0 minutes 10 seconds"*).
  * No keyboard trap inside the player container.

---

### Task 2: "Turn on Amharic captions and make them bigger."
* **Target Personas:** Deaf learner, Hard-of-hearing learner, Amharic-language learner.
* **Goal given to tester:** *"Turn on the Amharic captions and adjust their size so they are comfortable to read."*
* **What to observe:**
  * [ ] Does the user find the caption button (or press `C`)?
  * [ ] Can the user switch the caption track to Amharic (አማርኛ)?
  * [ ] Does the user discover the caption size slider or presets in Preferences (`⚙️`)?
  * [ ] Do the Ethiopic characters render smoothly using Noto Sans Ethiopic without missing glyphs or boxes?
  * [ ] Does resizing the text (100% to 300%) stutter or overlap with the video?
* **Success Criteria:**
  * Amharic captions display clearly on screen.
  * Text scales up to 200%–300% without breaking bounds.
  * Contrast remains compliant ($\ge 7:1$ for AAA presets).

---

### Task 3: "Find the lesson transcript and search for a topic."
* **Target Personas:** Deaf learner, Blind learner, Low-bandwidth learner.
* **Goal given to tester:** *"Open the transcript next to the video, read it, and search for a keyword."*
* **What to observe:**
  * [ ] Can the user open the transcript panel (via the `📝` button or pressing `T`)?
  * [ ] Is the search input field accessible with keyboard focus?
  * [ ] When typing in the search box, are player keyboard shortcuts (`Space`, `K`, `C`) safely ignored?
  * [ ] Does selecting or activating a transcript line seek the video to that exact timestamp?
  * [ ] Does the current active line highlight with `aria-current="true"` in sync with playback?
* **Success Criteria:**
  * Transcript renders side-by-side or stacked cleanly.
  * Search filtering dynamically updates cue lines.
  * Screen reader reads plain-language summary and individual cue lines accurately.

---

### Task 4: "Download the lesson transcript as Braille (.brf)."
* **Target Personas:** Blind learner, Refreshable Braille display user.
* **Goal given to tester:** *"Export or download the transcript in Braille format to read on a display."*
* **What to observe:**
  * [ ] Can the user find the *"Download Braille (.brf)"* button inside the transcript header?
  * [ ] Does activating the button trigger the `.brf` file download?
  * [ ] Does the file open properly in a Braille previewer or emboss with 40 cells $\times$ 25 lines format?
  * [ ] Is the draft disclaimer clearly legible at the top: `[DRAFT - PENDING BRAILLE READER REVIEW]`?
* **Success Criteria:**
  * `.brf` file downloads successfully in English or Amharic (Ethiopic Grade 1).
  * Form-feed character (`\x0c`) separates 25-line pages.

---

### Task 5: "Switch to High-Contrast AAA mode and zoom to 200%."
* **Target Personas:** Low-vision learner.
* **Goal given to tester:** *"Make the player high-contrast and zoom the screen to 200%."*
* **What to observe:**
  * [ ] Does the user open the Preferences dialog (`⚙️`) and select High-Contrast AAA?
  * [ ] When browser zoom is increased to 200% (or 400%), does the layout reflow into a single column without horizontal scrolling?
  * [ ] Do control buttons maintain touch targets of at least 44 CSS px?
  * [ ] Are yellow-on-black or white-on-black contrast borders crisp and legible?
* **Success Criteria:**
  * Contrast ratio $\ge 7:1$ achieved across all interactive elements.
  * No horizontal scrollbar at 320 CSS px width.

---

## 4. Observer Scoring & Feedback Sheet

| Participant ID | Assistive Tech / Browser | Task 1 (Watch) | Task 2 (Captions) | Task 3 (Transcript) | Task 4 (Braille) | Task 5 (Contrast/Zoom) | Overall Score (out of 5) |
|---|---|---|---|---|---|---|---|
| P-01 (Blind) | NVDA + Chrome | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | /5 |
| P-02 (Deaf) | ESL + Firefox | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | /5 |
| P-03 (Low Vision) | 200% Zoom + High Contrast | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | [ ] Unaided [ ] Help [ ] Fail | /5 |

### Incident Logging Template
* **Timestamp & Feature:**
* **Observation (What happened):**
* **User Quote / Reaction:**
* **Severity (Critical / Serious / Moderate):**
* **Root Cause & Same-Day Remediation:**

---

## 5. Member 4 Handoff Checklist

- [x] Automated Playwright + Axe-Core test suite authored in `demo/sandbox-player/test/player.spec.ts`.
- [x] Zero axe violations verified on default load and all modal dialog states.
- [x] Reflow at 320 CSS px and 200%/400% zoom tested with automated checks.
- [x] Co-designer testing protocol and task scripts completed for Member 1 stream.
- [ ] Member 4 incorporated Member 1 tasks into unified `docs/TEST-PLAN.md`.
