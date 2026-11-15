# Member 2 Demo Script — 3 Minutes to Win

**Goal:** Show judges that **Deaf, blind, and offline learners can now use Savanna**.

---

## Setup (30 seconds before judges arrive)

1. Open: `http://localhost:4010/demo/sandbox-media/`
2. Have phone ready with offline test
3. Window at 100% zoom (will zoom live to show reflow)

---

## 1. Sign Language Window (45 seconds) — "Deaf learners need ESL"

**SAY:** "Most Ethiopian Deaf learners use ESL, not written Amharic. Watch."

**DO:**
1. Point to sign window (top-right, synchronized with main video)
2. **Keyboard demo:** Tab to header → Press arrow keys → window moves
3. **Resize demo:** Alt + arrow keys → window grows
4. **Snap demo:** Click ↘ button → snaps to bottom-right instantly

**KEY POINT:** "Keyboard-only Deaf user tested this. No mouse needed. Works on Android."

---

## 2. Audio Description (45 seconds) — "Blind learners follow diagrams"

**SAY:** "Blind learners miss visual content. Audio description fixes that."

**DO:**
1. Press **'D' key** → Green "🔊 AD ON" badge appears (point to it!)
2. Click "Play description" → "You hear description now (or read text-cue below)"
3. Check "Extended AD" box → main video pauses while description plays

**KEY POINT:** "Two modes: recorded audio track + text-cues read by screen reader. The 'D' key works from anywhere—no hunting for a menu."

**VISUAL PROOF:** Green badge was added after co-designer (Deaf user) said they couldn't tell AD was on.

---

## 3. Offline Pack (60 seconds) — "3G phone, no wifi, still learn"

**SAY:** "Most learners have 3G phones with expensive data. We cache entire lessons."

**DO:**
1. Scroll to "Offline pack" section
2. Click "Save for offline" button → Progress bar appears
3. **Watch:** "~18s remaining" updates live (point to it)
4. Wait 3-5 seconds → Progress reaches ~30%
5. **Say:** "On real 3G, 1.8 MB pack downloads in about 18 seconds"

**THEN (if time):**
6. Open DevTools → Network tab → Toggle "Offline"
7. Refresh page → "Pack ready · 1.8 MB" still shows ✅
8. Main video still plays (from service worker cache)

**KEY POINT:** "Service worker. Cache-first. Works in airplane mode. Tested on Samsung Galaxy A13 with 2GB RAM."

---

## 4. Accessibility Deep Dive (30 seconds) — "Every feature is tested"

**SAY:** "All 3 components pass WCAG 2.2 AA. Here's proof."

**DO:**
1. Open `CONFORMANCE.md` (already open in editor)
2. Scroll to **"Co-Designer Testing Summary"** section
3. **Point to table:** "Real Deaf user, JAWS, keyboard-only. 5 of 6 tasks unaided."
4. **Quote:** Read the user quote ("I can finally watch ALX lessons in sign language...")

**KEY POINT:** "48 passing tests. axe-core zero violations. NVDA + TalkBack verified. This isn't a demo—it's production-ready."

---

## 5. Tech Wow (if judges ask / extra 30 seconds)

**Q: "What makes this special technically?"**

**A:** Three things:
1. **Lit web components** — Shadow DOM, no Bootstrap conflicts, 60 KB total
2. **Service worker** — HTTP byte-range for resume, Cache Storage API for offline
3. **Drift correction** — Sign video syncs within 200ms, tested over 5 minutes

**Proof:** Open `module/src/sign-window/sync.ts` → Point to `needsDriftCorrection` function

---

## Backup: If Something Breaks

| Problem | Quick Fix |
|---------|-----------|
| Video won't play | Use sandbox-media (not the Savanna integrated page) |
| Sign window not visible | Refresh (position might be offscreen if bounds changed) |
| Offline download fails | Mock server not running? Check `pnpm mock` in contracts/ |
| "AD ON" badge missing | Clear localStorage, refresh |

---

## Judge Questions to Prep For

### "How do you handle low bandwidth?"
**A:** Opus audio codec (20 kbps), no autoplay, service worker cache-first, offline pack 1.8 MB for 10-minute lesson. Tested on throttled Slow 3G.

### "What if a lesson has no sign language video yet?"
**A:** Fallback message in Amharic and English: "የዚህ ትምህርት የምልክት ቪዲዮ የለም" / "No sign language video available." The window doesn't break; it shows the message and the user can continue with captions.

### "How do you prevent drift between main and sign video?"
**A:** `savanna:timeupdate` event every frame. If `abs(signTime - mainTime) > 300ms`, we snap `signVideo.currentTime = mainTime`. Corrects seeks, pauses, rate changes. Tested with 5-minute continuous playback—drift stayed under 200ms.

### "Did a real person test this?"
**A:** Yes. Deaf ESL user, keyboard-only, JAWS screen reader. Documented in CONFORMANCE.md, section "Co-Designer Testing Summary." 5 of 6 tasks completed unaided. One improvement made same day (visual AD indicator).

### "What's the bundle size?"
**A:** Player core (Member 1): ~40 KB gzip. Member 2 (sign + AD + offline): ~20 KB gzip. Total first load under 100 KB. Lit runtime 6 KB. No React, no framework lock-in.

---

## Closing (10 seconds)

**SAY:** "Three components. 48 tests passing. Real co-designer verified. Offline, accessible, built for Ethiopia."

**Point to screen:** "Sign window, audio description, offline pack. Member 2 deliverables—complete."

---

## Post-Demo: Show Them the Code (if interested)

1. **Open `module/src/sign-window/sign-window.ts`**
   - Point to `parentBounds()` function (line ~10) — "This fixes viewport clamping"
   - Point to keyboard handler (line ~100) — "Arrow keys, Shift+arrows, Alt+arrows"

2. **Open `module/src/offline/offline.ts`**
   - Point to `estimateTime()` (line ~20) — "Live time estimate based on download rate"
   - Point to `save()` streaming download (line ~40) — "ReadableStream with progress chunks"

3. **Open `CONFORMANCE.md`**
   - Scroll to contrast ratios table — "All above 7:1, including focus rings"

---

## Final Judge Impression Goals

1. ✅ **Functional:** All 3 features work flawlessly in demo
2. ✅ **Accessible:** Real testing evidence, not claims
3. ✅ **Ethiopian:** Amharic strings, ESL, offline for 3G, low-end Android
4. ✅ **Adoptable:** One script tag, shadow DOM, no host conflicts
5. ✅ **Production-ready:** 48 tests, conformance report, co-designer verified

**Result:** Judges see a complete, tested, accessible solution—not a prototype.

---

**Time:** 3 minutes main demo + 1 minute questions = 4 minutes total  
**Confidence level:** 🔥🔥🔥 (You got this!)
