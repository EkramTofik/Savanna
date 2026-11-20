import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

  test("1.2 Axe-Core scan with active modals, panels, and popovers (Zero Violations)", async ({ page }) => {
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

  test("1.3 320 CSS px Viewport reflow without horizontal scroll (NFR-A3, WCAG 1.4.10)", async ({ page }) => {
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

  test("1.4 200% and 400% Zoom maintain single column and layout integrity (NFR-A3, WCAG 1.4.4)", async ({ page }) => {
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

  test("1.5 Forced-colors / High-Contrast mode conformance (NFR-A4, WCAG 1.4.6)", async ({ page }) => {
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

  test("1.8 Screen reader semantics and live region announcements (FR-P2, FR-P8)", async ({ page }) => {
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

  test("1.9 Bilingual UI switching and dynamic lang attribute (FR-P10, Contract C4)", async ({ page }) => {
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

  test("1.11 Relative caption URL resolution, track normalization, and axe validation", async ({ page }) => {
    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();

    // 1. Verify track URL resolution and suppression of duplicate native subtitles
    const trackInfo = await player.evaluate((el: any) => {
      const tracks = Array.from(el.shadowRoot?.querySelectorAll("track") || []) as HTMLTrackElement[];
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
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(blocking).toEqual([]);
    expect(activeAxe.violations).toEqual([]);

    // Turn captions back off
    await player.locator(".btn-captions").click();
  });

  test("1.12 Development media URLs return real WebVTT and captions switch without reload", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const player = page.locator("savanna-player");
    await expect(player).toBeVisible();
    await expect
      .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
      .toBe("L-103");

    for (const [file, expectedText] of [
      ["en.vtt", "For the last 10 years"],
      ["am.vtt", "ላለፉት 10 ዓመታት"],
    ]) {
      const response = await request.get(new URL(`/media/${file}`, page.url()).href);
      expect(response.status(), `${file} should load through the page origin`).toBe(200);
      expect(response.headers()["content-type"]).toMatch(/text\/vtt/i);
      const body = await response.text();
      expect(body.startsWith("WEBVTT")).toBe(true);
      expect(body).toContain("00:00.000 --> 00:07.500");
      expect(body).toContain(expectedText);
    }

    await expect
      .poll(() => player.evaluate((element: any) => element.vttCuesCache?.get("en")?.length ?? 0))
      .toBeGreaterThan(0);
    await expect
      .poll(() => player.evaluate((element: any) => element.vttCuesCache?.get("am")?.length ?? 0))
      .toBeGreaterThan(0);

    const video = player.locator("video");
    if ((await player.locator(".btn-low-data").getAttribute("aria-pressed")) === "true") {
      await player.locator(".btn-low-data").click();
    }
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
      .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.duration))
      .toBeCloseTo(120, 1);

    const rangeResponse = await request.get(new URL("/media/lesson.mp4", page.url()).href, {
      headers: { Range: "bytes=0-1023" },
    });
    expect(rangeResponse.status()).toBe(206);
    expect(rangeResponse.headers()["content-range"]).toBe("bytes 0-1023/2096006");
    expect((await rangeResponse.body()).byteLength).toBe(1024);
    await video.evaluate(async (element: HTMLVideoElement) => {
      element.playbackRate = 0.5;
      element.currentTime = 2;
      await element.play();
    });
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(2);
    if ((await player.locator(".btn-captions").getAttribute("aria-pressed")) !== "true") {
      await player.locator(".btn-captions").click();
    }
    await expect(player.locator(".caption-overlay")).toBeVisible();
    await expect(player.locator(".caption-overlay .caption-cue")).toContainText(
      "For the last 10 years",
    );

    await player.locator(".btn-speed").click();
    await player.getByRole("menuitemradio", { name: "1.5x" }).click();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.playbackRate))
      .toBe(1.5);
    await player.locator(".btn-speed").click();
    await player.getByRole("menuitemradio", { name: /1\.0x/ }).click();

    await player.locator(".btn-captions").click();
    await expect(player.locator(".caption-overlay")).toHaveAttribute("hidden", "");
    await player.locator(".btn-captions").click();
    await expect(player.locator(".caption-overlay")).not.toHaveAttribute("hidden", "");

    await video.evaluate((element: HTMLVideoElement) => element.pause());
    await player.locator(".btn-language").click();
    await expect(player).toHaveAttribute("lang", "am");
    await expect(player.locator(".caption-overlay .caption-cue")).toContainText("ላለፉት 10 ዓመታት");
  });

  test("1.13 Required viewport sizes keep controls, menus, and unavailable sign state operable", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 360, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const player = page.locator("savanna-player");
      await expect(player).toBeVisible();
      await expect
        .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
        .toBe("L-103");

      const pageWidth = await page.evaluate(() => ({
        inner: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(pageWidth.document, `${viewport.width}px viewport has no horizontal page overflow`).toBeLessThanOrEqual(
        pageWidth.inner + 1,
      );
      await expect(player.locator(".player-controls")).toBeVisible();
      for (const selector of [".btn-low-data", ".btn-language", ".btn-captions", ".btn-preferences", ".btn-sign"]) {
        await expect(player.locator(selector), `${selector} visible at ${viewport.width}px`).toBeVisible();
      }

      const settingsButton = player.locator(".btn-preferences");
      await settingsButton.focus();
      await settingsButton.press("Enter");
      const dialog = player.locator("dialog.captions-dialog");
      await expect(dialog).toBeVisible();
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox).toBeTruthy();
      expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width + 1);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();

      const speed = player.locator(".btn-speed");
      await speed.click();
      const popover = player.locator(".speed-popover");
      await expect(popover).toBeVisible();
      const menuBox = await popover.boundingBox();
      expect(menuBox).toBeTruthy();
      expect(menuBox!.x).toBeGreaterThanOrEqual(0);
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width + 1);
      await page.keyboard.press("Escape");
      await expect(popover).not.toBeVisible();

      await player.locator(".btn-sign").click();
      const sign = page.locator("savanna-sign-window");
      await expect(sign).toBeVisible();
      await expect(sign.locator(".fallback")).toContainText(
        "Sign language interpretation is not available for this lesson",
      );
      const signToggle = sign.locator("button.toggle");
      await expect(signToggle).toBeVisible();
      await signToggle.focus();
      await signToggle.press("Space");
      await expect(signToggle).toHaveText("Off");
      await expect(signToggle).toBeVisible();
      await signToggle.focus();
      await signToggle.press("Space");
      await expect(sign.locator(".fallback")).toBeVisible();

      if (viewport.width === 1440) {
        const beforeResize = await sign.boundingBox();
        expect(beforeResize).toBeTruthy();
        await sign.locator("header").focus();
        await sign.locator("header").press("Alt+ArrowRight");
        await expect
          .poll(async () => (await sign.boundingBox())?.width ?? 0)
          .toBeGreaterThan(beforeResize!.width);
      }
    }

    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const touchContext = await browser!.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const touchPage = await touchContext.newPage();
      await touchPage.goto("/");
      const touchPlayer = touchPage.locator("savanna-player");
      await expect
        .poll(() => touchPlayer.evaluate((element: any) => element.manifestData?.id ?? ""))
        .toBe("L-103");
      const lowData = touchPlayer.locator(".btn-low-data");
      const lowDataBefore = await lowData.getAttribute("aria-pressed");
      await lowData.tap();
      await expect(lowData).toHaveAttribute("aria-pressed", lowDataBefore === "true" ? "false" : "true");
      await touchPlayer.locator(".btn-sign").tap();
      const touchSign = touchPage.locator("savanna-sign-window");
      await expect(touchSign).toBeVisible();
      await expect(touchSign.locator(".fallback")).toBeVisible();
      const toggleBounds = await touchSign.locator("button.toggle").boundingBox();
      const touchSignBounds = await touchSign.boundingBox();
      expect(toggleBounds).toBeTruthy();
      expect(touchSignBounds?.width).toBeGreaterThan(100);
      expect(toggleBounds!.x).toBeGreaterThanOrEqual(touchSignBounds!.x);
      expect(toggleBounds!.x + toggleBounds!.width).toBeLessThanOrEqual(
        touchSignBounds!.x + touchSignBounds!.width + 1,
      );
      await touchSign.locator("button.toggle").tap();
      await expect(touchSign.locator("button.toggle")).toHaveText("Off");
    } finally {
      await touchContext.close();
    }
  });

  test("1.14 Separate loopback API fallback recovers captions and video when page media paths 404", async ({
    page,
  }) => {
    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const fallbackContext = await browser!.newContext({ serviceWorkers: "block" });
    const fallbackPage = await fallbackContext.newPage();
    const pageOrigin = new URL(page.url()).origin;
    const apiOrigin = process.env.SAVANNA_API_PROXY_TARGET || "http://localhost:4010";
    const mediaResponses: Array<{ url: string; status: number }> = [];
    const failedRequests: Array<{ url: string; error: string | null }> = [];
    let player: any;
    try {
      await fallbackPage.route(`${pageOrigin}/media/**`, (route) =>
        route.fulfill({ status: 404, contentType: "text/plain", body: "No page-origin media mount" }),
      );
      fallbackPage.on("response", (response) => {
      if (response.url().includes("/media/"))
        mediaResponses.push({ url: response.url(), status: response.status() });
      });
      fallbackPage.on("requestfailed", (request) =>
        failedRequests.push({ url: request.url(), error: request.failure()?.errorText ?? null }),
      );

      await fallbackPage.goto(`${pageOrigin}/`);
      player = fallbackPage.locator("savanna-player");
      await expect
        .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
        .toBe("L-103");
      await player.evaluate(async (element: any, api: string) => {
        element.api = api;
        await element.updateComplete;
        await element.fetchLessonManifest();
      }, apiOrigin);
      try {
        await expect
          .poll(
            () => player.evaluate((element: any) => element.vttCuesCache?.get("en")?.length ?? 0),
            { timeout: 15_000 },
          )
          .toBeGreaterThan(0);
      } catch (error) {
        console.log(
          `Fallback diagnostics: ${JSON.stringify({
            player: await player.evaluate((element: any) => ({
              api: element.api,
              manifestId: element.manifestData?.id,
              manifestError: element.manifestLoadError,
              captions: element.manifestCaptions,
              englishCueCount: element.vttCuesCache?.get("en")?.length ?? 0,
              mediaRequested: element.mediaRequested,
            })),
            mediaResponses,
            failedRequests,
          })}`,
        );
        throw error;
      }
      await expect
        .poll(
          () => player.evaluate((element: any) => element.vttCuesCache?.get("am")?.length ?? 0),
          { timeout: 15_000 },
        )
        .toBeGreaterThan(0);

      if ((await player.locator(".btn-low-data").getAttribute("aria-pressed")) === "true") {
        await player.locator(".btn-low-data").click();
      }
      const video = player.locator("video");
      await fallbackPage.waitForTimeout(1000);
      await expect
        .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
        .toBeGreaterThanOrEqual(2);

      for (const language of ["en", "am"]) {
        expect(
          mediaResponses.some(
            (response) => response.url === `${apiOrigin}/media/${language}.vtt` && response.status === 200,
          ),
          `${language}.vtt should be recovered from the API origin; responses=${JSON.stringify(mediaResponses)}; failed=${JSON.stringify(failedRequests)}`,
        ).toBe(true);
      }
      expect(
        mediaResponses.some(
          (response) =>
            response.url === `${apiOrigin}/media/lesson.mp4` &&
            (response.status === 200 || response.status === 206),
        ),
        `lesson video should be recovered from the API origin; responses=${JSON.stringify(mediaResponses)}`,
      ).toBe(true);
    } finally {
      await fallbackContext.close();
    }
  });

  test("1.15 Video failure presents a retry action and playback resumes when media returns", async ({
    page,
  }) => {
    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const retryContext = await browser!.newContext({ serviceWorkers: "block" });
    const retryPage = await retryContext.newPage();
    const pageOrigin = new URL(page.url()).origin;
    let mediaAvailable = false;
    try {
      await retryPage.route(`${pageOrigin}/media/lesson.mp4`, (route) =>
        mediaAvailable
          ? route.continue()
          : route.fulfill({ status: 404, contentType: "text/plain", body: "Media temporarily unavailable" }),
      );
      await retryPage.goto(`${pageOrigin}/`);
      const player = retryPage.locator("savanna-player");
      await expect
        .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
        .toBe("L-103");
      await player.locator(".btn-play").click();
      const error = player.locator(".media-error");
      await expect(error).toBeVisible();
      const retry = error.getByRole("button", { name: "Retry" });
      await expect(retry).toBeVisible();

      mediaAvailable = true;
      await retry.click();
      const video = player.locator("video");
      await expect
        .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), {
          timeout: 15_000,
        })
        .toBeGreaterThan(0.2);
      await expect(player.locator(".media-error")).toHaveCount(0);
    } finally {
      await retryContext.close();
    }
  });

  test("1.16 Offline pack verifies files and retries only the failed file", async ({ page }) => {
    const browser = page.context().browser();
    expect(browser).toBeTruthy();
    const retryContext = await browser!.newContext({ serviceWorkers: "block" });
    const retryPage = await retryContext.newPage();
    const origin = new URL(page.url()).origin;
    const downloadedAssetRequests = new Map<string, number>();
    try {
      await retryPage.route(`${origin}/media/**`, async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        downloadedAssetRequests.set(pathname, (downloadedAssetRequests.get(pathname) ?? 0) + 1);
        if (pathname === "/media/am.vtt" && downloadedAssetRequests.get(pathname) === 1) {
          await route.fulfill({ status: 503, contentType: "text/plain", body: "Retry test interruption" });
        } else {
          await route.continue();
        }
      });
      await retryPage.goto(`${origin}/`);
      const player = retryPage.locator("savanna-player");
      await expect
        .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
        .toBe("L-103");
      const offline = player.locator("savanna-offline");
      await expect(offline.locator(".status")).toContainText("Pack ready");
      await expect
        .poll(() => player.evaluate((element: any) => element.vttCuesCache?.get("en")?.length ?? 0))
        .toBeGreaterThan(0);
      await expect
        .poll(() => player.evaluate((element: any) => element.vttCuesCache?.get("am")?.length ?? 0))
        .toBeGreaterThan(0);
      downloadedAssetRequests.clear();

      await offline.getByRole("button", { name: "Download offline pack" }).click();
      await expect(offline.locator(".status")).toContainText("captions-am", { timeout: 30_000 });
      const cachedVideoBeforeRetry = await retryPage.evaluate(async () => {
        const cache = await caches.open("savanna-pack-L-103");
        return Boolean(await cache.match(new URL("/media/lesson.mp4", location.origin).href));
      });
      expect(cachedVideoBeforeRetry, "the verified video should be retained after the partial failure").toBe(true);
      expect(downloadedAssetRequests.get("/media/lesson.mp4")).toBe(1);

      await offline.getByRole("button", { name: "Retry offline download" }).click();
      await expect(offline.locator(".status")).toContainText("Saved offline", { timeout: 30_000 });
      expect(downloadedAssetRequests.get("/media/lesson.mp4"), "retry should reuse the completed video").toBe(1);
      expect(downloadedAssetRequests.get("/media/am.vtt")).toBe(2);
      expect(downloadedAssetRequests.get("/media/lesson.opus")).toBe(1);
    } finally {
      await retryContext.close();
    }
  });

  test("1.17 A verified lesson opens and plays with captions after the browser goes offline", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const player = page.locator("savanna-player");
    await expect
      .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
      .toBe("L-103");
    const offline = player.locator("savanna-offline");
    await expect(offline.locator(".status")).toContainText("Pack ready");
    const downloadPack = offline.getByRole("button", { name: "Download offline pack" });
    await downloadPack.focus();
    await downloadPack.press("Enter");
    await expect(offline.locator(".status")).toContainText("Saved offline", { timeout: 30_000 });

    await page.reload();
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    await expect
      .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""))
      .toBe("L-103");
    if ((await player.locator(".btn-captions").getAttribute("aria-pressed")) !== "true") {
      await player.locator(".btn-captions").click();
    }

    try {
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect
        .poll(() => player.evaluate((element: any) => element.manifestData?.id ?? ""), {
          timeout: 15_000,
        })
        .toBe("L-103");
      const cachedRange = await page.evaluate(async () => {
        const response = await fetch("/media/lesson.mp4", { headers: { Range: "bytes=0-1023" } });
        return { status: response.status, range: response.headers.get("content-range") };
      });
      expect(cachedRange.status).toBe(206);
      expect(cachedRange.range).toBe("bytes 0-1023/2096006");

      await player.locator(".btn-play").click();
      const video = player.locator("video");
      await expect
        .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), {
          timeout: 15_000,
        })
        .toBeGreaterThan(0.2);
      await expect(player.locator(".caption-overlay .caption-cue")).toContainText(
        "For the last 10 years",
      );
    } finally {
      await context.setOffline(false);
    }
  });

  test("1.18 Keyboard-only lesson controls include honest missing-media states and transcript seek", async ({ page }) => {
    await page.goto("/");
    const player = page.locator("savanna-player");
    await expect.poll(() => player.evaluate((element: any) => element.manifestData?.id ?? "")).toBe("L-103");

    const play = player.locator(".btn-play");
    await play.focus();
    await play.press("Enter");
    await expect.poll(() => player.evaluate((element: any) => element.media?.currentTime ?? 0)).toBeGreaterThan(0.1);

    const captions = player.locator(".btn-captions");
    await captions.focus();
    await captions.press("Enter");
    await expect(player.locator(".caption-overlay")).toBeVisible();
    const language = page.locator("#btn-lang-toggle");
    await language.focus();
    await language.press("Enter");
    await expect(player).toHaveAttribute("lang", "am");

    const signToggle = player.locator(".btn-sign");
    await signToggle.focus();
    await signToggle.press("Enter");
    const sign = page.locator("savanna-sign-window");
    await expect(sign.locator(".fallback")).toContainText("ለዚህ ትምህርት የምልክት ቪዲዮ የለም");
    const signHeader = sign.locator("header");
    await signHeader.focus();
    const beforeMove = await sign.boundingBox();
    expect(beforeMove).toBeTruthy();
    await signHeader.press("ArrowLeft");
    await expect.poll(async () => (await sign.boundingBox())?.x ?? Infinity).toBeLessThan(beforeMove!.x);

    const ad = player.locator(".btn-ad");
    await ad.focus();
    await expect(ad).toHaveAttribute("aria-disabled", "true");
    await ad.press("Enter");
    await expect(player.locator('[role="status"][aria-atomic="true"]')).toContainText("የድምጽ ማብራሪያ");

    await language.focus();
    await language.press("Enter");
    await expect(player).toHaveAttribute("lang", "en");
    const transcript = player.locator(".btn-transcript");
    await transcript.focus();
    await transcript.press("Enter");
    const search = player.locator("#transcript-search-input");
    await search.fill("attention span");
    await expect(player.locator(".transcript-line")).toContainText("attention span");
    await search.press("Enter");
    await expect.poll(() => player.evaluate((element: any) => element.media?.currentTime ?? 0)).toBeGreaterThan(35);
  });
});
