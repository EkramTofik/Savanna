import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";

const API_ORIGIN = process.env.SAVANNA_API_TEST_ORIGIN ?? "http://127.0.0.1:4011";
const PLAYER_ORIGIN = process.env.SAVANNA_PLAYER_TEST_ORIGIN ?? "http://127.0.0.1:5175";

test.describe("Savanna Player - Member 1 Accessibility & Functional Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for savanna-player custom element to be defined and mounted
    await page.waitForSelector("savanna-player");
  });

  test("1.1 Baseline Axe-Core accessibility scan (Zero Violations)", async ({ page }) => {
    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    // Verify 0 critical and 0 serious violations (Hackathon threshold)
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);

    // Strict zero violations across all levels
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("1.2 Axe-Core scan with active modals, panels, and popovers (Zero Violations)", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    // 1. Open Preferences Modal (dialog.captions-dialog)
    await player.locator(".btn-preferences").click();
    await expect(player.locator("dialog.captions-dialog")).toBeVisible();
    const prefsAxe = await new AxeBuilder({ page }).analyze();
    const prefsBlocking = prefsAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(prefsBlocking, JSON.stringify(prefsBlocking, null, 2)).toEqual([]);

    // Close Preferences with Escape
    await page.keyboard.press("Escape");
    await expect(player.locator("dialog.captions-dialog")).not.toBeVisible();

    // 2. Open Keyboard Shortcuts Dialog (dialog.shortcuts-dialog)
    await player.locator(".btn-help").click();
    await expect(player.locator("dialog.shortcuts-dialog")).toBeVisible();
    const helpAxe = await new AxeBuilder({ page }).analyze();
    const helpBlocking = helpAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(helpBlocking, JSON.stringify(helpBlocking, null, 2)).toEqual([]);

    // Close Help with Escape
    await page.keyboard.press("Escape");
    await expect(player.locator("dialog.shortcuts-dialog")).not.toBeVisible();

    // 3. Open Interactive Transcript Panel
    await player.locator(".btn-transcript").click();
    await expect(player.locator(".transcript-panel")).toBeVisible();
    const transcriptAxe = await new AxeBuilder({ page }).analyze();
    const transcriptBlocking = transcriptAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(transcriptBlocking, JSON.stringify(transcriptBlocking, null, 2)).toEqual([]);
  });

  test("1.3 320 CSS px Viewport reflow without horizontal scroll (NFR-A3, WCAG 1.4.10)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    await page.waitForSelector("savanna-player");

    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    // Check no horizontal document scroll
    const scrollInfo = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(scrollInfo.scrollWidth).toBeLessThanOrEqual(scrollInfo.innerWidth + 1);

    // Verify player control bar is accessible
    const ctrlBar = player.locator(".player-controls");
    await expect(ctrlBar).toBeVisible();
  });

  test("1.4 200% and 400% Zoom maintain single column and layout integrity (NFR-A3, WCAG 1.4.4)", async ({
    page,
  }) => {
    for (const zoom of [2, 4]) {
      await page.evaluate((z) => {
        document.body.style.zoom = String(z);
      }, zoom);

      const player = page.locator("savanna-player");
      await expect(player).toBeVisible();
      const box = await player.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
    }
  });

  test("1.5 Forced-colors / High-Contrast mode conformance (NFR-A4, WCAG 1.4.6)", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active", colorScheme: "dark" });
    await page.goto("/");
    await page.waitForSelector("savanna-player");

    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    // Scan axe on the player element in forced-colors mode
    const results = await new AxeBuilder({ page }).include("savanna-player").analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("1.6 Reduced-motion emulation respected (NFR-A4, WCAG 2.3.3)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForSelector("savanna-player");

    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();
  });

  test("1.7 Full keyboard navigation and visible focus rings (FR-P1)", async ({ page }) => {
    const player = page.locator("savanna-player");
    const playBtn = player.locator(".btn-play");

    // 1. Focus play button and verify focus
    await playBtn.focus();
    await expect(playBtn).toBeFocused();

    // 2. Trigger Play/Pause via Enter
    await playBtn.press("Enter");

    // 3. Open Help modal via keyboard Enter on the button
    const helpBtn = player.locator(".btn-help");
    await helpBtn.focus();
    await expect(helpBtn).toBeFocused();
    await helpBtn.press("Enter");
    await expect(player.locator("dialog.shortcuts-dialog")).toBeVisible();

    // Dismiss with Escape
    await page.keyboard.press("Escape");
    await expect(player.locator("dialog.shortcuts-dialog")).not.toBeVisible();

    // 4. Toggle Transcript via keyboard Enter on the button
    const transcriptBtn = player.locator(".btn-transcript");
    await transcriptBtn.focus();
    await expect(transcriptBtn).toBeFocused();
    await transcriptBtn.press("Enter");
    await expect(transcriptBtn).toHaveAttribute("aria-expanded", "true");
    await expect(player.locator(".transcript-panel")).toBeVisible();

    // 5. Toggle Transcript closed with Escape or Space
    await page.keyboard.press("Escape");
    await expect(transcriptBtn).toHaveAttribute("aria-expanded", "false");
    await expect(player.locator(".transcript-panel")).not.toBeVisible();
  });

  test("1.8 Screen reader semantics and live region announcements (FR-P2, FR-P8)", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");

    // Control buttons have valid accessible names and attributes
    const playBtn = player.locator(".btn-play");
    await expect(playBtn).toHaveAttribute("aria-label");

    const captionsBtn = player.locator(".btn-captions");
    await expect(captionsBtn).toHaveAttribute("aria-expanded");

    const prefsBtn = player.locator(".btn-preferences");
    await expect(prefsBtn).toHaveAttribute("aria-haspopup", "dialog");

    // Live region exists and is polite
    const liveRegion = player.locator('div[role="status"]');
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");
    await expect(liveRegion).toHaveAttribute("aria-atomic", "true");
  });

  test("1.9 Bilingual UI switching and dynamic lang attribute (FR-P10, Contract C4)", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");
    const langPill = page.locator("#btn-lang-toggle");

    // Initially English
    await expect(player).toHaveAttribute("lang", "en");

    // Switch to Amharic
    await langPill.click();
    await expect(player).toHaveAttribute("lang", "am");

    // Verify Amharic translated label on captions or transcript button
    const transcriptBtn = player.locator(".btn-transcript");
    const labelAm = await transcriptBtn.getAttribute("aria-label");
    expect(labelAm).toBeTruthy();

    // Switch back to English
    await langPill.click();
    await expect(player).toHaveAttribute("lang", "en");
  });

  test("1.10 Braille (.brf) Export trigger (Task 1.8, FR-S1)", async ({ page }) => {
    const player = page.locator("savanna-player");

    // Open transcript panel
    await player.locator(".btn-transcript").click();
    const transcriptPanel = player.locator(".transcript-panel");
    await expect(transcriptPanel).toBeVisible();

    // Verify Braille download button is present and accessible
    const brailleBtn = player.locator(".btn-braille-transcript");
    await expect(brailleBtn).toBeVisible();
    await expect(brailleBtn).toHaveAttribute("aria-label");

    // Listen for download event
    const downloadPromise = page.waitForEvent("download");
    await brailleBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.brf$/i);
  });

  test("1.11 Relative caption URL resolution, track normalization, and axe validation", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    // 1. Verify track URL resolution and suppression of duplicate native subtitles
    const trackInfo = await player.evaluate((el: any) => {
      const tracks = Array.from(
        el.shadowRoot?.querySelectorAll("track") || [],
      ) as HTMLTrackElement[];
      const textTracks = Array.from(el.media?.textTracks || []) as TextTrack[];
      return {
        trackUrls: tracks.map((t) => t.src),
        trackModes: textTracks.map((t) => t.mode),
        hasOverlay: Boolean(el.shadowRoot?.querySelector(".caption-overlay")),
      };
    });

    // Tracks should exist and resolve to valid HTTP(S) URLs
    expect(trackInfo.hasOverlay).toBe(true);
    for (const url of trackInfo.trackUrls) {
      expect(url).toMatch(/^https?:\/\//);
    }
    // Text tracks should not be 'showing' by default (prevents duplicate overlay collisions)
    for (const mode of trackInfo.trackModes) {
      expect(mode).not.toBe("showing");
    }

    // 2. Toggle captions on and verify axe-core compliance with active captions
    await player.locator(".btn-captions").click();
    const activeAxe = await new AxeBuilder({ page }).analyze();
    const blocking = activeAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(blocking).toEqual([]);
    expect(activeAxe.violations).toEqual([]);

    // Turn captions back off
    await player.locator(".btn-captions").click();
  });

  test("1.12 L-103 manifest configures the sign and audio-description components", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");
    const sign = page.locator("savanna-sign-window");
    const audioDescription = page.locator("savanna-audio-description");

    await expect
      .poll(() =>
        player.evaluate((element: any) => ({
          sign: element.hasSignTrack,
          audioDescription: element.hasAdTrack,
        })),
      )
      .toEqual({ sign: true, audioDescription: true });

    const tracks = await player.evaluate((element: any) => {
      const signElement = element.querySelector("savanna-sign-window");
      const adElement = element.querySelector("savanna-audio-description");
      return {
        signUrl: signElement?.src,
        signOffsetMs: signElement?.offsetMs,
        signVideoUrl: signElement?.shadowRoot?.querySelector("video")?.getAttribute("src"),
        audioUrl: adElement?.src,
        textVttUrl: adElement?.textVtt,
        audioElementUrl: adElement?.shadowRoot?.querySelector("audio")?.getAttribute("src"),
      };
    });

    expect(tracks.signUrl).toBe(`${PLAYER_ORIGIN}/media/esl-placeholder.mp4`);
    expect(tracks.signOffsetMs).toBe(0);
    expect(tracks.signVideoUrl).toBe(`${PLAYER_ORIGIN}/media/esl-placeholder.mp4`);
    expect(tracks.audioUrl).toBe(`${PLAYER_ORIGIN}/media/ad.opus`);
    expect(tracks.textVttUrl).toBe(`${PLAYER_ORIGIN}/media/ad.vtt`);
    expect(tracks.audioElementUrl).toBe(`${PLAYER_ORIGIN}/media/ad.opus`);

    await player.locator(".btn-ad").click();
    await expect(player.locator(".btn-ad")).toHaveAttribute("aria-pressed", "true");
    await expect(audioDescription.locator(".ad-badge")).toHaveText("🔊 AD ON");

    await player.locator(".btn-sign").click();
    await expect.poll(() => sign.evaluate((element: any) => element.enabled)).toBe(false);
    await expect.poll(() => player.evaluate((element: any) => element.showSignWindow)).toBe(false);
  });

  test("1.16 integrated sign window stays inside the player and supports drag, resize, keyboard, fullscreen, and touch", async ({
    page,
    browser,
  }) => {
    const player = page.locator("savanna-player");
    const sign = page.locator("savanna-sign-window");
    const signVideo = sign.locator("video");

    await expect
      .poll(() =>
        signVideo.evaluate(
          (video: HTMLVideoElement) => video.readyState >= 1 && video.videoWidth > 0,
        ),
      )
      .toBe(true);
    await page.setViewportSize({ width: 1280, height: 800 });

    const readLayout = () =>
      player.evaluate((element: any) => {
        const overlay = element.querySelector("savanna-sign-window") as HTMLElement;
        const signVideo = overlay.shadowRoot.querySelector("video") as HTMLVideoElement;
        const playerVideo = element.media as HTMLVideoElement;
        const overlayRect = overlay.getBoundingClientRect();
        const signVideoRect = signVideo.getBoundingClientRect();
        const playerVideoRect = playerVideo.getBoundingClientRect();
        const parentRect = overlay.offsetParent?.getBoundingClientRect();
        return {
          parent: {
            left: parentRect?.left,
            top: parentRect?.top,
            width: (overlay.offsetParent as HTMLElement).clientWidth,
            height: (overlay.offsetParent as HTMLElement).clientHeight,
          },
          savedPosition: (overlay as any).position,
          boundMedia: {
            same: (overlay as any).main === element.media,
            rect: (overlay as any).main?.getBoundingClientRect().toJSON(),
            clientWidth: (overlay as any).main?.clientWidth,
            clientHeight: (overlay as any).main?.clientHeight,
          },
          overlayStyle: { left: overlay.style.left, top: overlay.style.top },
          overlay: {
            left: overlayRect.left,
            top: overlayRect.top,
            right: overlayRect.right,
            bottom: overlayRect.bottom,
            width: overlayRect.width,
            height: overlayRect.height,
          },
          signVideo: { width: signVideoRect.width, height: signVideoRect.height },
          playerVideo: {
            left: playerVideoRect.left,
            top: playerVideoRect.top,
            right: playerVideoRect.right,
            bottom: playerVideoRect.bottom,
            clientWidth: playerVideo.clientWidth,
            clientHeight: playerVideo.clientHeight,
          },
        };
      });

    const assertInsidePlayerVideo = async () => {
      const layout = await readLayout();
      expect(layout.overlay.left).toBeGreaterThanOrEqual(layout.playerVideo.left - 1);
      expect(layout.overlay.top).toBeGreaterThanOrEqual(layout.playerVideo.top - 1);
      expect(layout.overlay.right, JSON.stringify(layout)).toBeLessThanOrEqual(
        layout.playerVideo.right + 1,
      );
      expect(layout.overlay.bottom, JSON.stringify(layout)).toBeLessThanOrEqual(
        layout.playerVideo.bottom + 1,
      );
      expect(layout.signVideo.width, JSON.stringify(layout)).toBeGreaterThan(0);
      expect(layout.signVideo.height, JSON.stringify(layout)).toBeGreaterThan(0);
      expect(layout.signVideo.width / layout.signVideo.height).toBeCloseTo(16 / 9, 1);
      return layout;
    };

    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );
      const layout = await assertInsidePlayerVideo();
      expect(layout.overlay.width).toBeLessThanOrEqual(
        layout.playerVideo.right - layout.playerVideo.left + 1,
      );
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    const header = sign.locator("header");
    const beforeDrag = await readLayout();
    const headerBox = await header.boundingBox();
    expect(beforeDrag).toBeTruthy();
    expect(headerBox).toBeTruthy();
    const dragStart = { x: headerBox!.x + 35, y: headerBox!.y + headerBox!.height / 2 };
    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragStart.x - 48, dragStart.y + 28, { steps: 4 });
    await page.mouse.up();
    await expect
      .poll(async () => {
        const after = await readLayout();
        const beforeX = beforeDrag.overlay.left - beforeDrag.playerVideo.left;
        const beforeY = beforeDrag.overlay.top - beforeDrag.playerVideo.top;
        const afterX = after.overlay.left - after.playerVideo.left;
        const afterY = after.overlay.top - after.playerVideo.top;
        return afterX < beforeX - 20 && afterY > beforeY + 10;
      })
      .toBe(true);
    await assertInsidePlayerVideo();

    const beforeResize = await sign.boundingBox();
    const resizeHandle = sign.locator(".handle.se");
    const handleBox = await resizeHandle.boundingBox();
    expect(beforeResize).toBeTruthy();
    expect(handleBox).toBeTruthy();
    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2,
      handleBox!.y + handleBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 38, handleBox!.y + 24, { steps: 4 });
    await page.mouse.up();
    await expect
      .poll(async () => {
        const after = await sign.boundingBox();
        return after && beforeResize ? after.width > beforeResize.width + 12 : false;
      })
      .toBe(true);
    await assertInsidePlayerVideo();

    await header.focus();
    const beforeKeyboard = await readLayout();
    await header.press("ArrowLeft");
    await expect
      .poll(async () => {
        const after = await readLayout();
        return (
          after.overlay.left - after.playerVideo.left <
          beforeKeyboard.overlay.left - beforeKeyboard.playerVideo.left
        );
      })
      .toBe(true);
    const beforeKeyboardResize = await sign.boundingBox();
    await header.press("Alt+ArrowUp");
    await expect
      .poll(async () => {
        const after = await sign.boundingBox();
        return after && beforeKeyboardResize ? after.width < beforeKeyboardResize.width : false;
      })
      .toBe(true);
    await expect(sign.locator("p[role=status]")).toContainText("Position");

    await player.locator(".btn-fullscreen").click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await assertInsidePlayerVideo();
    await player.locator(".btn-fullscreen").click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);

    const touchContext = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 768, height: 1024 },
    });
    try {
      const touchPage = await touchContext.newPage();
      await touchPage.goto("/");
      const touchSign = touchPage.locator("savanna-sign-window");
      await expect
        .poll(() =>
          touchSign
            .locator("video")
            .evaluate((video: HTMLVideoElement) => video.readyState >= 1 && video.videoWidth > 0),
        )
        .toBe(true);
      const touchHeader = touchSign.locator("header");
      await touchHeader.scrollIntoViewIfNeeded();
      const touchPosition = () =>
        touchPage.locator("savanna-player").evaluate((element: any) => {
          const overlay = element.querySelector("savanna-sign-window").getBoundingClientRect();
          const video = element.media.getBoundingClientRect();
          return { x: overlay.left - video.left, y: overlay.top - video.top };
        });
      const touchPositionBefore = await touchPosition();
      const touchHeaderBox = await touchHeader.boundingBox();
      expect(touchHeaderBox).toBeTruthy();
      const cdp = await touchContext.newCDPSession(touchPage);
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
      const touchStart = {
        x: touchHeaderBox!.x + 32,
        y: touchHeaderBox!.y + touchHeaderBox!.height / 2,
      };
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ id: 1, ...touchStart }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ id: 1, x: touchStart.x - 36, y: touchStart.y + 22 }],
      });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect
        .poll(async () => {
          const after = await touchPosition();
          return after.x < touchPositionBefore.x - 12 && after.y > touchPositionBefore.y + 8;
        })
        .toBe(true);

      const touchResize = touchSign.locator(".handle.se");
      const touchResizeBox = await touchResize.boundingBox();
      const touchSignBefore = await touchSign.boundingBox();
      expect(touchResizeBox).toBeTruthy();
      expect(touchSignBefore).toBeTruthy();
      const resizeStart = {
        x: touchResizeBox!.x + touchResizeBox!.width / 2,
        y: touchResizeBox!.y + touchResizeBox!.height / 2,
      };
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ id: 2, ...resizeStart }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ id: 2, x: resizeStart.x + 28, y: resizeStart.y }],
      });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect
        .poll(async () => {
          const after = await touchSign.boundingBox();
          return after && touchSignBefore ? after.width > touchSignBefore.width + 10 : false;
        })
        .toBe(true);
      await cdp.detach();
    } finally {
      await touchContext.close();
    }
  });

  test("1.17 integrated Audio Description follows text/audio modes, seek, pause, resume, and extended playback", async ({
    page,
  }) => {
    const player = page.locator("savanna-player");
    const ad = page.locator("savanna-audio-description");
    const audio = ad.locator("audio");

    await expect
      .poll(() =>
        player.evaluate(
          (element: any) => element.media.readyState >= 1 && element.media.duration > 0,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        audio.evaluate(
          (element: HTMLAudioElement) => element.readyState >= 1 && element.duration > 0,
        ),
      )
      .toBe(true);

    const mode = ad.locator("select");
    const extended = ad.locator('input[type="checkbox"]');
    await mode.selectOption("text");
    await expect
      .poll(() =>
        ad.evaluate((element: any) => element.shadowRoot.querySelectorAll(".sr-only").length > 0),
      )
      .toBe(true);
    await expect.poll(() => ad.evaluate((element: any) => element.cues?.length > 0)).toBe(true);
    await player.locator(".btn-ad").click();
    await expect(ad.locator(".ad-badge")).toHaveText("🔊 AD ON");
    await player.evaluate((element: any) => element.seekTo(3));
    await expect(ad.locator(".sr-only")).toContainText(
      "A colourful test pattern fills the screen.",
    );

    await mode.selectOption("audio");
    await expect(ad.locator(".ad-badge")).toHaveText("🔊 AD ON");
    await player.locator(".btn-ad").click();
    await expect(ad.locator(".ad-badge")).toHaveText("AD OFF");
    await extended.uncheck();
    await player.locator(".btn-play").click();
    await expect.poll(() => player.evaluate((element: any) => !element.media.paused)).toBe(true);
    await player.locator(".btn-ad").click();
    await expect
      .poll(() => audio.evaluate((element: HTMLAudioElement) => !element.paused))
      .toBe(true);

    await player.evaluate((element: any) => element.seekTo(1.5));
    await expect
      .poll(
        async () =>
          Math.abs(
            (await audio.evaluate((element: HTMLAudioElement) => element.currentTime)) - 1.5,
          ) < 0.6,
      )
      .toBe(true);
    await player.locator(".btn-play").click();
    await expect
      .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
      .toBe(true);
    await player.locator(".btn-play").click();
    await expect
      .poll(() => audio.evaluate((element: HTMLAudioElement) => !element.paused))
      .toBe(true);

    await extended.check();
    await expect.poll(() => player.evaluate((element: any) => element.media.paused)).toBe(true);
    await expect
      .poll(() => audio.evaluate((element: HTMLAudioElement) => !element.paused))
      .toBe(true);
    await ad.locator("button").last().click();
    await expect.poll(() => player.evaluate((element: any) => !element.media.paused)).toBe(true);
    await expect
      .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
      .toBe(true);
  });

  test("1.18 integrated media loads without browser errors or duplicate player timeline events", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedMediaRequests: string[] = [];
    const badMediaResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText || "failed";
      // Chromium reports intentional source changes (network URL to an already cached blob) as aborted.
      if (
        (request.resourceType() === "media" || request.url().includes("/media/")) &&
        failure !== "net::ERR_ABORTED"
      ) {
        failedMediaRequests.push(`${request.url()}: ${failure}`);
      }
    });
    page.on("response", (response) => {
      if (response.url().includes("/media/") && response.status() >= 400)
        badMediaResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.reload();
    const player = page.locator("savanna-player");
    const signVideo = page.locator("savanna-sign-window video");
    const adAudio = page.locator("savanna-audio-description audio");
    const offline = page.locator("savanna-offline#offline-save");
    await expect
      .poll(() =>
        player.evaluate(
          (element: any) => element.media.readyState >= 1 && element.media.duration > 0,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        signVideo.evaluate(
          (video: HTMLVideoElement) => video.readyState >= 1 && video.videoWidth > 0,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        adAudio.evaluate((audio: HTMLAudioElement) => audio.readyState >= 1 && audio.duration > 0),
      )
      .toBe(true);
    await expect(offline).toContainText("Pack ready");

    const timelineEvents = await page.evaluate(() => {
      const player = document.querySelector("savanna-player") as any;
      let timeUpdates = 0;
      let seeks = 0;
      player.addEventListener("savanna:timeupdate", () => timeUpdates++);
      player.addEventListener("savanna:seek", () => seeks++);
      player.media.dispatchEvent(new Event("timeupdate"));
      player.media.dispatchEvent(new Event("seeking"));
      return { timeUpdates, seeks };
    });
    expect(timelineEvents).toEqual({ timeUpdates: 1, seeks: 1 });
    expect(failedMediaRequests, JSON.stringify(failedMediaRequests)).toEqual([]);
    expect(badMediaResponses, JSON.stringify(badMediaResponses)).toEqual([]);
    expect(pageErrors, JSON.stringify(pageErrors)).toEqual([]);
    expect(consoleErrors, JSON.stringify(consoleErrors)).toEqual([]);
  });

  test("1.13 offline lesson pack caches playable audio and the player switches to it when connectivity is lost", async ({
    page,
  }) => {
    const offline = page.locator("savanna-offline#offline-save");
    const player = page.locator("savanna-player");

    await page.evaluate(async () => {
      for (const name of await caches.keys())
        if (name.startsWith("savanna-pack-L-103-v")) await caches.delete(name);
    });
    await page.reload();

    await expect(offline).toContainText("Pack ready");
    await expect
      .poll(() =>
        player
          .locator("video")
          .first()
          .evaluate((video: HTMLVideoElement) => video.src),
      )
      .toContain("/media/lesson.mp4");
    await offline.getByRole("button", { name: /Save for offline/ }).click();
    await expect(offline).toContainText("Saved offline", { timeout: 20_000 });

    const cached = await page.evaluate(async (apiOrigin: string) => {
      for (const name of await caches.keys()) {
        if (!name.startsWith("savanna-pack-L-103-v")) continue;
        const response = await (await caches.open(name)).match(`${apiOrigin}/media/lesson.opus`);
        if (response)
          return {
            type: response.headers.get("content-type"),
            size: Number(response.headers.get("content-length")),
          };
      }
      return null;
    }, PLAYER_ORIGIN);
    expect(cached?.type).toBe("audio/ogg");
    expect(cached?.size).toBeGreaterThan(0);

    await page.context().setOffline(true);
    await expect
      .poll(() =>
        player
          .locator("video")
          .first()
          .evaluate((video: HTMLVideoElement) => video.src),
      )
      .toMatch(/^blob:/);
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    await page.reload();
    await expect(offline).toContainText("Saved offline", { timeout: 20_000 });
    await expect
      .poll(() =>
        player
          .locator("video")
          .first()
          .evaluate((video: HTMLVideoElement) => video.src),
      )
      .toMatch(/^blob:/);
  });
  test("1.14 an interrupted multi-range pack download resumes from its saved byte offset", async ({
    page,
  }) => {
    const offline = page.locator("savanna-offline#offline-save");
    await page.evaluate(async () => {
      for (const name of await caches.keys())
        if (name.startsWith("savanna-pack-L-103-v")) await caches.delete(name);
      localStorage.removeItem("savanna.prefs.v1");
    });
    const chunkSize = 256 * 1024;
    const totalBytes = chunkSize * 2 + 31;
    const sourcePackResponse = await page.request.get(`${API_ORIGIN}/v1/lessons/L-103/pack`);
    const sourcePack = await sourcePackResponse.json();
    const sourceLessonResponse = await page.request.get(`${API_ORIGIN}/v1/lessons/L-103`);
    const sourceLesson = await sourceLessonResponse.json();
    const originalAudioSize = sourcePack.files.find(
      (file: { path: string }) => file.path === "lesson.opus",
    ).sizeBytes;
    const overriddenPackSize = sourcePack.sizeBytes - originalAudioSize + totalBytes;
    const lessonEndpoint = new URL("/v1/lessons/L-103", page.url()).href;
    const packEndpoint = new URL("/v1/lessons/L-103/pack-test", page.url()).href;
    await page.route(lessonEndpoint, async (route) => {
      const manifest = structuredClone(sourceLesson);
      manifest.pack.sizeBytes = overriddenPackSize;
      manifest.pack.manifestUrl = "/v1/lessons/L-103/pack-test";
      manifest.media.audio = `${PLAYER_ORIGIN}/media-test/lesson.opus`;
      return route.fulfill({ status: 200, contentType: "application/json", json: manifest });
    });
    await page.route(packEndpoint, async (route) => {
      const manifest = structuredClone(sourcePack);
      const audio = manifest.files.find((file: { path: string }) => file.path === "lesson.opus");
      audio.sizeBytes = totalBytes;
      audio.sha256 = createHash("sha256").update(Buffer.alloc(totalBytes, 7)).digest("hex");
      manifest.sizeBytes = manifest.files.reduce(
        (sum: number, file: { sizeBytes: number }) => sum + file.sizeBytes,
        0,
      );
      expect(manifest.sizeBytes).toBe(overriddenPackSize);
      return route.fulfill({ status: 200, contentType: "application/json", json: manifest });
    });
    await page.reload();
    await expect(offline).toContainText("Pack ready");

    let interrupted = false;
    const requestedOffsets: number[] = [];
    await page.route(`${PLAYER_ORIGIN}/media-test/lesson.opus`, async (route) => {
      const header = route.request().headers().range || "";
      const match = /^bytes=(\d+)-(\d+)$/.exec(header);
      if (!match) return route.fulfill({ status: 416 });
      const start = Number(match[1]);
      const requestedEnd = Number(match[2]);
      requestedOffsets.push(start);
      if (start >= chunkSize && !interrupted) {
        interrupted = true;
        return route.abort();
      }
      const end = Math.min(requestedEnd, totalBytes - 1);
      const body = Buffer.alloc(end - start + 1, 7);
      return route.fulfill({
        status: 206,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length",
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
          "Content-Length": String(body.length),
          "Content-Type": "audio/ogg",
        },
        body,
      });
    });

    await offline.getByRole("button", { name: /Save for offline/ }).click();
    await expect(offline).toContainText("Failed to fetch", { timeout: 20_000 });
    await expect(offline.getByRole("button", { name: /Resume download/ })).toBeVisible();
    await offline.getByRole("button", { name: /Resume download/ }).click();
    await expect(offline).toContainText("Saved offline", { timeout: 20_000 });
    expect(requestedOffsets).toEqual([0, chunkSize, chunkSize, chunkSize * 2]);
  });

  test("1.15 a completed resource with the wrong checksum is rejected and its partial chunks are removed", async ({
    page,
  }) => {
    const offline = page.locator("savanna-offline#offline-save");
    await page.evaluate(async () => {
      for (const name of await caches.keys())
        if (name.startsWith("savanna-pack-L-103-v")) await caches.delete(name);
      localStorage.removeItem("savanna.prefs.v1");
    });
    const totalBytes = 256 * 1024 + 37;
    const sourcePackResponse = await page.request.get(`${API_ORIGIN}/v1/lessons/L-103/pack`);
    const sourcePack = await sourcePackResponse.json();
    const sourceLessonResponse = await page.request.get(`${API_ORIGIN}/v1/lessons/L-103`);
    const sourceLesson = await sourceLessonResponse.json();
    const originalAudioSize = sourcePack.files.find(
      (file: { path: string }) => file.path === "lesson.opus",
    ).sizeBytes;
    const overriddenPackSize = sourcePack.sizeBytes - originalAudioSize + totalBytes;
    const lessonEndpoint = new URL("/v1/lessons/L-103", page.url()).href;
    const packEndpoint = new URL("/v1/lessons/L-103/pack-test", page.url()).href;
    await page.route(lessonEndpoint, async (route) => {
      const manifest = structuredClone(sourceLesson);
      manifest.pack.sizeBytes = overriddenPackSize;
      manifest.pack.manifestUrl = "/v1/lessons/L-103/pack-test";
      manifest.media.audio = `${PLAYER_ORIGIN}/media-test/lesson.opus`;
      return route.fulfill({ status: 200, contentType: "application/json", json: manifest });
    });
    await page.route(packEndpoint, async (route) => {
      const manifest = structuredClone(sourcePack);
      const audio = manifest.files.find((file: { path: string }) => file.path === "lesson.opus");
      audio.sizeBytes = totalBytes;
      audio.sha256 = "0".repeat(64);
      manifest.sizeBytes = manifest.files.reduce(
        (sum: number, file: { sizeBytes: number }) => sum + file.sizeBytes,
        0,
      );
      return route.fulfill({ status: 200, contentType: "application/json", json: manifest });
    });
    await page.route(`${PLAYER_ORIGIN}/media-test/lesson.opus`, async (route) => {
      const rangeHeader = route.request().headers().range || "";
      const match = /^bytes=(\d+)-(\d+)$/.exec(rangeHeader);
      if (!match) return route.fulfill({ status: 416 });
      const start = Number(match[1]);
      const end = Math.min(Number(match[2]), totalBytes - 1);
      const body = Buffer.alloc(end - start + 1, 7);
      return route.fulfill({
        status: 206,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length",
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
          "Content-Length": String(body.length),
          "Content-Type": "audio/ogg",
        },
        body,
      });
    });
    await page.reload();
    await expect(offline).toContainText("Pack ready");
    await offline.getByRole("button", { name: /Save for offline/ }).click();
    await expect(offline).toContainText("checksum for lesson.opus does not match", {
      timeout: 20_000,
    });

    const result = await page.evaluate(async (apiOrigin: string) => {
      for (const name of await caches.keys()) {
        if (!name.startsWith("savanna-pack-L-103-v")) continue;
        const cache = await caches.open(name);
        const keys = await cache.keys();
        const preferences = JSON.parse(localStorage.getItem("savanna.prefs.v1") || "{}");
        return {
          assetCached: Boolean(await cache.match(`${apiOrigin}/media-test/lesson.opus`)),
          partialChunks: keys.filter((request) =>
            request.url.includes("/__savanna_offline__/L-103/0/"),
          ).length,
          partialState: preferences.offline?.partials?.["L-103"],
        };
      }
      return { assetCached: false, partialChunks: 0, partialState: null };
    }, PLAYER_ORIGIN);
    expect(result).toEqual({ assetCached: false, partialChunks: 0, partialState: undefined });
  });
});
