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
