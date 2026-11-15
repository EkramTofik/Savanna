# Member 1 Player Experience: Saturday Verification Runbook

Use this checklist before submission. Automated checks provide regression evidence for the browser
and player component; they do not replace testing with disabled people or manual screen-reader audits.
Record the tester, device/browser, date, outcome and any issue for every manual check.

## 1. Automated Baseline

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @savanna/sandbox-player exec playwright install chromium
pnpm --filter @savanna/sandbox-player test
```

Expected:
- The component and sandbox-player build succeed.
- All 10 Playwright automated accessibility tests pass.
- Axe-core scan reports **zero violations** across default, open modal, and high-contrast states.
- 320 CSS px reflow check confirms no horizontal scrolling.

## 2. Start the Sandbox

In your terminal:

```bash
pnpm --dir demo/sandbox-player run dev
```

Open `http://localhost:5173` for the player sandbox.

## 3. Keyboard & Screen-Reader Verification (Tasks 1.1–1.3)

- [ ] Unplug or ignore the mouse: reach every control using `Tab` and `Shift+Tab`.
- [ ] Confirm focus rings have high visibility ($\ge 3:1$ contrast) on all buttons and sliders.
- [ ] Test playback shortcuts: `Space` or `K` toggles play/pause; `J` and `L` jump 10 seconds.
- [ ] Test secondary shortcuts: `M` toggles mute, `F` toggles fullscreen, `?` opens shortcut dialog, `Escape` closes dialogs.
- [ ] Listen with NVDA or TalkBack: confirm button names, slider values, and status changes announce in the active language.
- [ ] Verify captions are not flooded into the screen reader live region (FR-P2).

## 4. Captions & Bilingual UI (Tasks 1.4, 1.6)

- [ ] Press `C` to toggle captions on and off.
- [ ] Switch between English and Amharic caption tracks; verify Noto Sans Ethiopic renders all glyphs cleanly.
- [ ] Open Preferences (`⚙️`): adjust caption font size from 100% to 300%; verify smooth scaling without stutter.
- [ ] Switch caption color presets (Yellow on Black, White on Black, Black on White); verify contrast $\ge 7:1$.
- [ ] Toggle UI language pill (`🌐 አማርኛ`); verify UI strings update without reloading the page.

## 5. Interactive Transcript & Braille Export (Tasks 1.5, 1.8)

- [ ] Press `T` to toggle the side-by-side transcript panel.
- [ ] Verify active sentence highlights with `aria-current="true"` as the video plays.
- [ ] Click or press `Enter` on any transcript cue line to seek the video to that timestamp.
- [ ] Test transcript search filter: typing filters the cues; verify player shortcuts are safely bypassed during typing.
- [ ] Click the Braille export button: verify `.brf` file downloads in 40 cells $\times$ 25 lines format with the `[DRAFT - PENDING BRAILLE READER REVIEW]` header.

## 6. Offline Manifest Fallback & 200% Zoom (Tasks 1.7, 1.9)

- [ ] Test at 320 CSS px width: verify single-column reflow with zero horizontal page scroll.
- [ ] Test at 200% and 400% zoom: verify control buttons maintain minimum 44px touch targets.
- [ ] Test with JavaScript disabled (`<noscript>`): verify fallback links to MP4, audio Opus, VTT, and BRF files are accessible.
- [ ] Test offline caching: disconnect network and verify cached lesson manifest loads from `localStorage`.

## 7. Accessibility Gate & Member 4 Handoff

- [ ] Run `pnpm --filter @savanna/sandbox-player test` and confirm 0 axe violations.
- [ ] Hand over `docs/MEMBER1_SATURDAY_TEST.md` to Member 4 for integration into `docs/TEST-PLAN.md`.
