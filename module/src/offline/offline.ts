import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { parseLessonManifest, type LessonManifest } from "../player/lesson-manifest.js";
import { shouldSendApiKey } from "../player/caption-loader.js";
import { buildPackResources, parsePackManifest, type PackManifest } from "./offline-pack.js";
import { registerSavannaMediaWorker } from "./register-service-worker.js";

const PREFERENCES_KEY = "savanna.prefs.v1";
const CACHE_PREFIX = "savanna-pack-";
const CHUNK_BYTES = 256 * 1024;
const PACK_PATH = /^([A-Za-z0-9_-]{1,80})$/;

interface OfflinePreferences {
  savedLessons: string[];
  partials: Record<string, { version: number; bytes: number }>;
}

function readOfflinePreferences(): OfflinePreferences {
  try {
    const root = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
    const offline = root?.offline;
    return {
      savedLessons: Array.isArray(offline?.savedLessons)
        ? offline.savedLessons.filter((id: unknown): id is string => typeof id === "string")
        : [],
      partials:
        offline?.partials &&
        typeof offline.partials === "object" &&
        !Array.isArray(offline.partials)
          ? offline.partials
          : {},
    };
  } catch {
    return { savedLessons: [], partials: {} };
  }
}

function writeOfflinePreferences(value: OfflinePreferences): void {
  try {
    const root = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
    const preferences = root && typeof root === "object" && !Array.isArray(root) ? root : {};
    preferences.offline = value;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Cache Storage remains the source of truth if localStorage is unavailable.
  }
}

function cacheName(lessonId: string, version: number): string {
  return `${CACHE_PREFIX}${lessonId}-v${version}`;
}

function chunkRequest(lessonId: string, index: number, offset: number): Request {
  const url = new URL(
    `/__savanna_offline__/${encodeURIComponent(lessonId)}/${index}/${offset}`,
    location.origin,
  );
  return new Request(url.href);
}

function contentRange(value: string | null): { start: number; end: number; total: number } | null {
  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(value || "");
  if (!match) return null;
  const start = Number(match[1]!);
  const end = Number(match[2]!);
  const total = Number(match[3]!);
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    Number.isSafeInteger(total) &&
    start <= end &&
    end < total
    ? { start, end, total }
    : null;
}

@customElement("savanna-offline")
export class SavannaOffline extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: inherit;
      font:
        16px/1.5 system-ui,
        sans-serif;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    button {
      min-height: 44px;
      padding: 8px 14px;
      border: 1px solid #594267;
      border-radius: 8px;
      background: #5b3477;
      color: #fff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: #4a2a62;
    }
    button:focus-visible {
      outline: 3px solid #e09b00;
      outline-offset: 3px;
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    progress {
      width: min(100%, 360px);
      height: 20px;
    }
    .progress-container {
      margin: 12px 0;
    }
    .progress-text {
      margin: 6px 0 0;
    }
    .size {
      font-size: 0.875em;
      opacity: 0.9;
    }
    .status {
      margin: 0.75rem 0;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: #0f172a;
      overflow-wrap: anywhere;
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        transition: none !important;
      }
    }
  `;

  @property() api = "";
  @property({ attribute: "api-key" }) apiKey = "";
  @property({ attribute: "lesson-id" }) lessonId = "";
  @property() lang = "en";

  @state() private manifest: PackManifest | null = null;
  @state() private status = "Load a lesson pack to begin.";
  @state() private busy = false;
  @state() private progress = 0;
  @state() private saved = false;
  @state() private canResume = false;

  private lessonManifest: LessonManifest | null = null;
  private controller?: AbortController;
  private refreshController?: AbortController;
  private generation = 0;
  private connectionGeneration = 0;
  private serviceWorkerReady = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.refreshSavedState();
    const connectionGeneration = ++this.connectionGeneration;
    void registerSavannaMediaWorker().finally(() => {
      if (!this.isConnected || connectionGeneration !== this.connectionGeneration) return;
      this.serviceWorkerReady = true;
      void this.refresh();
    });
  }

  disconnectedCallback(): void {
    this.connectionGeneration++;
    this.serviceWorkerReady = false;
    this.controller?.abort();
    this.refreshController?.abort();
    super.disconnectedCallback();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("api") || changed.has("apiKey") || changed.has("lessonId")) {
      this.generation++;
      this.refreshController?.abort();
      this.manifest = null;
      this.lessonManifest = null;
      this.progress = 0;
      this.refreshSavedState();
      if (this.serviceWorkerReady && this.api && this.lessonId) void this.refresh();
    }
  }

  private refreshSavedState(): void {
    const preferences = readOfflinePreferences();
    this.saved = preferences.savedLessons.includes(this.lessonId);
    this.canResume = Boolean(preferences.partials[this.lessonId]);
  }

  private apiUrl(path: string): string {
    const base = new URL(this.api, document.baseURI);
    if (base.protocol !== "https:" && base.protocol !== "http:")
      throw new Error("The API URL must use HTTP or HTTPS.");
    return new URL(path, base).href;
  }

  private apiHeaders(url: string): Record<string, string> {
    return shouldSendApiKey(url, this.apiKey, this.api) ? { "X-Savanna-Key": this.apiKey } : {};
  }

  private parsePackForLesson(lesson: LessonManifest, value: unknown): PackManifest {
    const pack = parsePackManifest(value, lesson.id);
    if (!lesson.pack || pack.sizeBytes !== lesson.pack.sizeBytes) {
      throw new Error(
        "The lesson and offline pack report different download sizes. Refresh the lesson data and try again.",
      );
    }
    return pack;
  }

  private async refresh(): Promise<void> {
    if (!this.api || !this.lessonId || !PACK_PATH.test(this.lessonId)) {
      this.status = "Enter a valid lesson id and API address to load offline options.";
      return;
    }
    const generation = ++this.generation;
    this.refreshController?.abort();
    const controller = new AbortController();
    this.refreshController = controller;
    this.status = "Checking lesson and offline pack…";
    try {
      const lessonUrl = this.apiUrl(`/v1/lessons/${encodeURIComponent(this.lessonId)}`);
      let lesson: LessonManifest;
      let usedCachedManifest = false;
      try {
        const lessonResponse = await fetch(lessonUrl, {
          headers: this.apiHeaders(lessonUrl),
          signal: controller.signal,
        });
        if (!lessonResponse.ok)
          throw new Error(
            lessonResponse.status === 404
              ? "This lesson is not available."
              : `Lesson request failed (${lessonResponse.status}).`,
          );
        lesson = parseLessonManifest(await lessonResponse.json(), this.lessonId);
      } catch (error) {
        if (controller.signal.aborted) throw error;
        const cached = localStorage.getItem(`savanna.cached_manifest.${this.lessonId}`);
        if (!cached) throw error;
        try {
          lesson = parseLessonManifest(JSON.parse(cached), this.lessonId);
          usedCachedManifest = true;
        } catch {
          throw error;
        }
      }
      if (!lesson.pack) throw new Error("This lesson does not have an offline pack.");

      const packUrl = new URL(lesson.pack.manifestUrl, this.apiUrl("/")).href;
      const packResponse = await fetch(packUrl, {
        headers: this.apiHeaders(packUrl),
        signal: controller.signal,
      });
      if (!packResponse.ok)
        throw new Error(
          packResponse.status === 404
            ? "An offline pack has not been published for this lesson."
            : `Pack request failed (${packResponse.status}).`,
        );
      const pack = this.parsePackForLesson(lesson, await packResponse.json());
      if (generation !== this.generation) return;
      this.lessonManifest = lesson;
      this.manifest = pack;
      this.refreshSavedState();
      if (this.saved && typeof caches !== "undefined") {
        const cache = await caches.open(cacheName(this.lessonId, pack.version));
        const resources = buildPackResources(lesson, pack, this.api, this.apiKey);
        const complete = await Promise.all(
          resources.map(async (resource) => {
            const response = await cache.match(resource.url);
            if (!response) return false;
            try {
              await this.verifyResource(resource, await response.arrayBuffer());
              return true;
            } catch {
              await cache.delete(resource.url);
              return false;
            }
          }),
        );
        if (!complete.every(Boolean)) {
          const preferences = readOfflinePreferences();
          preferences.savedLessons = preferences.savedLessons.filter((id) => id !== this.lessonId);
          writeOfflinePreferences(preferences);
          this.saved = false;
        }
      }
      this.status = `${usedCachedManifest ? "Offline pack ready" : "Pack ready"} · ${this.formatSize(pack.sizeBytes)}${this.saved ? " · Saved offline" : this.canResume ? " · Download can resume" : ""}`;
    } catch (error) {
      if (controller.signal.aborted || generation !== this.generation) return;
      this.manifest = null;
      this.status =
        error instanceof Error ? error.message : "The offline pack could not be loaded.";
    } finally {
      if (this.refreshController === controller) this.refreshController = undefined;
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private async ensureStorage(requiredBytes: number): Promise<void> {
    if (!navigator.storage?.estimate) return;
    const estimate = await navigator.storage.estimate();
    const remaining = (estimate.quota ?? Number.POSITIVE_INFINITY) - (estimate.usage ?? 0);
    if (remaining < requiredBytes)
      throw new Error(
        "There is not enough device storage for this download. Free space and try again.",
      );
  }

  private async verifyResource(
    resource: { url: string; expectedBytes?: number; expectedSha256: string },
    bytes: ArrayBuffer,
  ): Promise<void> {
    if (resource.expectedBytes !== undefined && bytes.byteLength !== resource.expectedBytes) {
      throw new Error(
        `The downloaded file size does not match the offline pack for ${new URL(resource.url).pathname.split("/").pop()}.`,
      );
    }
    if (!globalThis.crypto?.subtle)
      throw new Error(
        "This browser cannot verify offline file checksums. Use a current browser over HTTPS or localhost.",
      );
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    const actual = Array.from(new Uint8Array(digest), (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");
    if (actual !== resource.expectedSha256) {
      throw new Error(
        `The checksum for ${new URL(resource.url).pathname.split("/").pop()} does not match the offline pack. Its partial download was removed; try again.`,
      );
    }
  }

  private async discardPartial(cache: Cache, index: number, total: number): Promise<void> {
    for (let offset = 0; offset < total; offset += CHUNK_BYTES) {
      await cache.delete(chunkRequest(this.lessonId, index, offset));
    }
    const preferences = readOfflinePreferences();
    delete preferences.partials[this.lessonId];
    writeOfflinePreferences(preferences);
    this.canResume = false;
  }

  private async save(): Promise<void> {
    if (this.busy || !this.manifest) return;
    if (typeof caches === "undefined") {
      this.status =
        "Offline saving is unavailable in this browser. Open the lesson over HTTPS or localhost and enable site storage.";
      return;
    }
    const lessonUrl = this.apiUrl(`/v1/lessons/${encodeURIComponent(this.lessonId)}`);
    this.busy = true;
    this.progress = 0;
    this.controller = new AbortController();
    const controller = this.controller;
    const generation = this.generation;
    try {
      let lesson = this.lessonManifest;
      if (!lesson) {
        const lessonResponse = await fetch(lessonUrl, {
          headers: this.apiHeaders(lessonUrl),
          signal: controller.signal,
        });
        if (!lessonResponse.ok)
          throw new Error(`Lesson request failed (${lessonResponse.status}).`);
        lesson = parseLessonManifest(await lessonResponse.json(), this.lessonId);
      }
      if (!lesson.pack) throw new Error("This lesson does not have an offline pack.");
      const packUrl = new URL(lesson.pack.manifestUrl, this.apiUrl("/")).href;
      const packResponse = await fetch(packUrl, {
        headers: this.apiHeaders(packUrl),
        signal: controller.signal,
      });
      if (!packResponse.ok) throw new Error(`Pack request failed (${packResponse.status}).`);
      const pack = this.parsePackForLesson(lesson, await packResponse.json());
      if (generation !== this.generation) return;
      const resources = buildPackResources(lesson, pack, this.api, this.apiKey);
      const cache = await caches.open(cacheName(this.lessonId, pack.version));
      const preferences = readOfflinePreferences();
      const resourceEstimate = resources.reduce(
        (sum, resource) => sum + (resource.expectedBytes ?? 0),
        0,
      );
      const totalExpected = Math.max(pack.sizeBytes, resourceEstimate);
      let savedBefore = 0;
      for (const resource of resources) {
        let existing = await cache.match(resource.url);
        if (existing) {
          const bytes = await existing.arrayBuffer();
          try {
            await this.verifyResource(resource, bytes);
          } catch {
            await cache.delete(resource.url);
            existing = undefined;
          }
          if (existing) savedBefore += bytes.byteLength;
        }
      }

      for (let index = 0; index < resources.length; index++) {
        const resource = resources[index]!;
        if (await cache.match(resource.url)) {
          this.progress = Math.round(Math.min(1, savedBefore / Math.max(1, totalExpected)) * 100);
          continue;
        }
        const knownPartial =
          preferences.partials[this.lessonId]?.version === pack.version
            ? await this.readPartial(cache, index)
            : { offset: 0, total: 0, chunks: [] as Response[] };
        let offset = knownPartial.offset;
        let total = knownPartial.total;
        const chunks = knownPartial.chunks;
        let savedWholeResponse = false;
        while (!total || offset < total) {
          const end = total
            ? Math.min(offset + CHUNK_BYTES - 1, total - 1)
            : offset + CHUNK_BYTES - 1;
          const response = await fetch(resource.url, {
            headers: { ...resource.headers, Range: `bytes=${offset}-${end}` },
            signal: controller.signal,
          });
          if (response.status !== 206) {
            if (response.status === 200 && offset === 0) {
              const responseSize =
                Number(response.headers.get("Content-Length")) || resource.expectedBytes || 0;
              if (responseSize > CHUNK_BYTES) {
                throw new Error(
                  `The server does not support resumable byte ranges for ${new URL(resource.url).pathname.split("/").pop()}.`,
                );
              }
              const body = await response.arrayBuffer();
              await this.verifyResource(resource, body);
              await this.ensureStorage(body.byteLength);
              await cache.put(
                resource.url,
                new Response(body, {
                  headers: {
                    "Content-Type":
                      response.headers.get("Content-Type") || responseContentType(resource.url),
                    "Content-Length": String(body.byteLength),
                  },
                }),
              );
              savedBefore += body.byteLength;
              this.progress = Math.round(
                Math.min(99, (savedBefore / Math.max(1, totalExpected)) * 100),
              );
              savedWholeResponse = true;
              break;
            }
            throw new Error(
              `Download failed (${response.status}) for ${new URL(resource.url).pathname.split("/").pop()}.`,
            );
          }
          const range = contentRange(response.headers.get("Content-Range"));
          if (
            !range ||
            range.start !== offset ||
            range.end > end ||
            (total && range.total !== total) ||
            (resource.expectedBytes !== undefined && range.total !== resource.expectedBytes)
          ) {
            throw new Error(
              "The server returned an invalid byte range. The download was paused safely.",
            );
          }
          await this.ensureStorage(range.end - range.start + 1);
          total = range.total;
          const bytes = await response.arrayBuffer();
          if (bytes.byteLength !== range.end - range.start + 1)
            throw new Error(
              "The downloaded chunk was incomplete. Resume the download to continue.",
            );
          await cache.put(
            chunkRequest(this.lessonId, index, offset),
            new Response(bytes, {
              headers: {
                "Content-Length": String(bytes.byteLength),
                "X-Savanna-Total": String(total),
              },
            }),
          );
          chunks.push(new Response(bytes));
          offset = range.end + 1;
          preferences.partials[this.lessonId] = {
            version: pack.version,
            bytes: savedBefore + offset,
          };
          writeOfflinePreferences(preferences);
          this.canResume = true;
          this.progress = Math.round(
            Math.min(99, ((savedBefore + offset) / Math.max(1, totalExpected)) * 100),
          );
          this.status = `Saving lesson resources · ${this.progress}%`;
        }
        if (savedWholeResponse) continue;
        const blob = new Blob(await Promise.all(chunks.map((chunk) => chunk.blob())), {
          type: responseContentType(resource.url),
        });
        try {
          await this.verifyResource(resource, await blob.arrayBuffer());
        } catch (error) {
          await this.discardPartial(cache, index, total);
          throw error;
        }
        await this.ensureStorage(blob.size);
        await cache.put(
          resource.url,
          new Response(blob, {
            headers: { "Content-Type": blob.type, "Content-Length": String(blob.size) },
          }),
        );
        for (let offset = 0; offset < total; offset += CHUNK_BYTES)
          await cache.delete(chunkRequest(this.lessonId, index, offset));
        savedBefore += blob.size;
        this.progress = Math.round(Math.min(99, (savedBefore / Math.max(1, totalExpected)) * 100));
      }

      preferences.savedLessons = [...new Set([...preferences.savedLessons, this.lessonId])];
      delete preferences.partials[this.lessonId];
      writeOfflinePreferences(preferences);
      this.saved = true;
      this.canResume = false;
      this.progress = 100;
      this.status = `Saved offline · ${this.formatSize(savedBefore)}`;
    } catch (error) {
      if (controller.signal.aborted) {
        this.status =
          "Download paused. Your completed chunks are saved; choose Resume to continue.";
        this.canResume = true;
      } else {
        this.status =
          error instanceof Error ? error.message : "The offline download failed. Try again.";
        this.canResume = Boolean(readOfflinePreferences().partials[this.lessonId]);
      }
    } finally {
      if (this.controller === controller) this.controller = undefined;
      this.busy = false;
    }
  }

  private async readPartial(
    cache: Cache,
    index: number,
  ): Promise<{ offset: number; total: number; chunks: Response[] }> {
    const chunks: Response[] = [];
    let offset = 0;
    let total = 0;
    while (true) {
      const response = await cache.match(chunkRequest(this.lessonId, index, offset));
      if (!response) break;
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength === 0) break;
      chunks.push(new Response(bytes));
      offset += bytes.byteLength;
      if (!total) total = Number(response.headers.get("X-Savanna-Total")) || 0;
      if (total && offset >= total) break;
    }
    // Older chunks may not carry the total header; the next range request will establish it.
    return { offset, total, chunks };
  }

  private pause(): void {
    this.controller?.abort();
  }

  private async removeSavedCopy(): Promise<void> {
    if (this.busy) return;
    const preferences = readOfflinePreferences();
    const prefix = `${CACHE_PREFIX}${this.lessonId}-`;
    for (const key of await caches.keys()) if (key.startsWith(prefix)) await caches.delete(key);
    preferences.savedLessons = preferences.savedLessons.filter((id) => id !== this.lessonId);
    delete preferences.partials[this.lessonId];
    writeOfflinePreferences(preferences);
    this.saved = false;
    this.canResume = false;
    this.progress = 0;
    this.status = "Offline copy deleted from this device.";
  }

  private refreshClick = (): void => {
    void this.refresh();
  };
  private saveClick = (): void => {
    void this.save();
  };
  private removeClick = (): void => {
    void this.removeSavedCopy();
  };

  protected render() {
    const size = this.manifest ? this.formatSize(this.manifest.sizeBytes) : "";
    return html`
      <div class="row">
        ${
          this.saved
            ? html`<button type="button" @click=${this.removeClick} ?disabled=${this.busy}>
                Delete offline copy
              </button>`
            : html`<button
                type="button"
                @click=${this.saveClick}
                ?disabled=${this.busy || !this.manifest}
              >
                ${this.busy ? "Saving…" : this.canResume ? "Resume download" : "Save for offline"}${size ? html` <span class="size">(${size})</span>` : ""}
              </button>`
        }
        ${
          this.busy
            ? html`<button type="button" @click=${this.pause} aria-label="Pause offline download">
                Pause
              </button>`
            : html`<button
                type="button"
                @click=${this.refreshClick}
                ?disabled=${!this.api || !this.lessonId}
              >
                Refresh
              </button>`
        }
      </div>
      ${
        this.busy || this.progress > 0
          ? html`<div class="progress-container">
              <progress
                max="100"
                .value=${this.progress}
                aria-label=${`Offline download progress ${this.progress}%`}
              ></progress>
              <p class="progress-text">${this.progress}%</p>
            </div>`
          : ""
      }
      <p class="status" role="status" aria-live="polite" aria-atomic="true">${this.status}</p>
    `;
  }
}

function responseContentType(url: string): string {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".vtt")) return "text/vtt";
  if (path.endsWith(".opus")) return "audio/ogg";
  if (path.endsWith(".webm")) return "video/webm";
  if (path.endsWith(".mp4")) return "video/mp4";
  if (path.includes("/transcript")) return "application/json";
  return "application/octet-stream";
}
