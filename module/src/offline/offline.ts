import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  buildLessonPackAssets,
  findPackFileIntegrity,
  verifyPackAssetBytes,
  type LessonPackManifest,
} from "./pack-assets.js";
import { registerSavannaMediaWorker } from "./register-service-worker.js";

const PREFS_KEY = "savanna.prefs.v1";
const CACHE_PREFIX = "savanna-pack-";

type OfflinePreferences = { savedLessons: string[]; incompleteLessons: string[] };

function readOfflinePreferences(): OfflinePreferences {
  try {
    const root = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return { savedLessons: [], incompleteLessons: [], ...(root.offline || {}) };
  } catch {
    return { savedLessons: [], incompleteLessons: [] };
  }
}

function writeOfflinePreferences(value: OfflinePreferences): void {
  try {
    const root = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    root.offline = value;
    localStorage.setItem(PREFS_KEY, JSON.stringify(root));
  } catch {
    throw new Error("Browser settings storage is full or unavailable.");
  }
}

@customElement("savanna-offline")
export class SavannaOffline extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #f8fafc;
      background: #0b192c;
      border: 1px solid #64748b;
      border-radius: 10px;
      padding: 0.9rem;
      font:
        1rem/1.5 system-ui,
        sans-serif;
    }
    .summary {
      margin: 0 0 0.65rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    button {
      min-height: 44px;
      padding: 0.55rem 0.85rem;
      border: 1px solid #49305f;
      border-radius: 8px;
      background: #4d2865;
      color: #fff;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: #38204a;
    }
    button:focus-visible {
      outline: 3px solid #e09b00;
      outline-offset: 3px;
    }
    button:disabled {
      opacity: 0.58;
      cursor: not-allowed;
    }
    button.secondary {
      background: #fff;
      color: #241b2b;
    }
    progress {
      display: block;
      width: min(100%, 28rem);
      height: 1.15rem;
      margin-top: 0.8rem;
    }
    .progress-text,
    .status {
      margin: 0.45rem 0 0;
    }
    .status {
      min-height: 1.5em;
    }
    .error {
      color: #fca5a5;
    }
    .success {
      color: #86efac;
    }
    .note {
      color: #cbd5e1;
      font-size: 0.92em;
    }
    @media (forced-colors: active) {
      :host {
        color: CanvasText;
        background: Canvas;
        border-color: CanvasText;
      }
      button,
      button.secondary {
        color: ButtonText;
        background: ButtonFace;
        border-color: ButtonText;
      }
      .error,
      .success,
      .note {
        color: CanvasText;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  @property() api = "";
  @property({ attribute: "api-key" }) apiKey = "";
  @property({ attribute: "lesson-id" }) lessonId = "";

  @state() private manifest: (LessonPackManifest & { sizeBytes?: number }) | null = null;
  @state() private status = "Download this lesson to keep its available files on this device.";
  @state() private busy = false;
  @state() private progress = 0;
  @state() private saved = false;
  @state() private incomplete = false;
  @state() private error = false;
  @state() private language: "en" | "am" = "en";

  private controller?: AbortController;

  connectedCallback(): void {
    super.connectedCallback();
    this.saved = readOfflinePreferences().savedLessons.includes(this.lessonId);
    this.incomplete = readOfflinePreferences().incompleteLessons.includes(this.lessonId);
    this.language = this.currentLanguage();
    void registerSavannaMediaWorker("/media-sw.js");
    void this.refresh();
  }

  updated(changed: Map<string, unknown>): void {
    if ((changed.has("api") || changed.has("lessonId")) && this.api && this.lessonId)
      void this.refresh();
    const lang = this.currentLanguage();
    if (lang !== this.language) this.language = lang;
  }

  private currentLanguage(): "en" | "am" {
    const value =
      this.closest("savanna-player")?.getAttribute("lang") || document.documentElement.lang || "en";
    return value.toLowerCase().startsWith("am") ? "am" : "en";
  }

  private text(en: string, am: string): string {
    return this.language === "am" ? am : en;
  }

  private apiOrigin(): string {
    return this.api.replace(/\/$/, "");
  }

  private packUrl(): string {
    return `${this.apiOrigin()}/v1/lessons/${encodeURIComponent(this.lessonId)}/pack`;
  }

  private lessonUrl(): string {
    return `${this.apiOrigin()}/v1/lessons/${encodeURIComponent(this.lessonId)}`;
  }

  private cacheName(): string {
    return `${CACHE_PREFIX}${this.lessonId}`;
  }

  private headersFor(url: string): Record<string, string> {
    if (!this.apiKey) return {};
    try {
      if (new URL(url).origin === new URL(this.apiOrigin()).origin)
        return { "X-Savanna-Key": this.apiKey };
    } catch {}
    return {};
  }

  private async refresh(): Promise<void> {
    if (!this.api || !this.lessonId || this.busy) return;
    try {
      const fetchOrCached = async (url: string) => {
        try {
          const response = await fetch(url, { headers: this.headersFor(url) });
          if (!response.ok)
            throw new Error(
              response.status === 404
                ? "No offline pack is published for this lesson."
                : `Pack information could not be loaded (${response.status}).`,
            );
          return response;
        } catch (cause) {
          if (typeof caches !== "undefined") {
            const cache = await caches.open(this.cacheName());
            const cached = await cache.match(url);
            if (cached) return cached;
          }
          throw cause instanceof Error
            ? cause
            : new Error("Connect once to load this lesson pack.");
        }
      };
      const packResponse = await fetchOrCached(this.packUrl());
      const lessonResponse = await fetchOrCached(this.lessonUrl());
      const pack = await packResponse.json();
      const lesson = await lessonResponse.json();
      const manifest = { ...lesson, sizeBytes: Number(pack.sizeBytes) || 0, packMetadata: pack };
      this.manifest = manifest;
      if (typeof caches !== "undefined") {
        const cache = await caches.open(this.cacheName());
        await cache.put(
          this.packUrl(),
          new Response(JSON.stringify(pack), { headers: { "Content-Type": "application/json" } }),
        );
        await cache.put(
          this.lessonUrl(),
          new Response(JSON.stringify(lesson), { headers: { "Content-Type": "application/json" } }),
        );
      }
      this.saved = readOfflinePreferences().savedLessons.includes(this.lessonId);
      this.error = false;
      this.status = `${this.text("Pack ready", "ጥቅሉ ዝግጁ ነው")} · ${this.size(manifest.sizeBytes || 0)}`;
    } catch (cause) {
      this.error = true;
      this.status =
        cause instanceof Error ? cause.message : "Pack information could not be loaded.";
    }
  }

  private size(bytes: number): string {
    return bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private async checkAvailableStorage(
    cache: Cache,
    urls: string[],
    declaredBytes: number,
  ): Promise<void> {
    if (!navigator.storage?.estimate) return;
    let alreadyStored = 0;
    for (const url of urls) {
      const cached = await cache.match(url);
      if (cached)
        alreadyStored +=
          Number(cached.headers.get("content-length")) ||
          (await cached.clone().arrayBuffer()).byteLength;
    }
    const estimate = await navigator.storage.estimate();
    if (typeof estimate.quota === "number" && typeof estimate.usage === "number") {
      const missing = Math.max(0, declaredBytes - alreadyStored);
      if (estimate.quota - estimate.usage < missing * 1.05) {
        throw new DOMException(
          "There may not be enough browser storage for this lesson. Remove an offline copy or free device space and retry.",
          "QuotaExceededError",
        );
      }
    }
  }

  private async saveAsset(
    cache: Cache,
    assetUrl: string,
    kind: string,
    totalBytes: number,
    completedBytes: number,
  ): Promise<number> {
    const integrity = this.manifest ? findPackFileIntegrity(this.manifest, assetUrl) : undefined;
    const existing = await cache.match(assetUrl);
    if (existing) {
      const content = await existing.clone().arrayBuffer();
      try {
        await verifyPackAssetBytes(content, integrity);
        const bytes = content.byteLength;
        this.progress =
          totalBytes > 0
            ? Math.min(99, Math.round(((completedBytes + bytes) / totalBytes) * 100))
            : this.progress;
        return bytes;
      } catch {
        await cache.delete(assetUrl);
      }
    }

    this.status = `${this.text("Downloading", "በማውረድ ላይ")}: ${kind}`;
    let response: Response;
    try {
      response = await this.fetchAsset(assetUrl);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`${kind} ${detail}`);
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("This browser cannot stream lesson downloads.");

    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      if (!part.value) continue;
      chunks.push(part.value);
      bytes += part.value.byteLength;
      this.progress =
        totalBytes > 0
          ? Math.min(99, Math.round(((completedBytes + bytes) / totalBytes) * 100))
          : this.progress;
    }

    const blob = new Blob(chunks as BlobPart[], {
      type: response.headers.get("content-type") || "application/octet-stream",
    });
    await verifyPackAssetBytes(await blob.arrayBuffer(), integrity);
    const headers = new Headers(response.headers);
    headers.set("Content-Length", String(blob.size));
    await cache.put(assetUrl, new Response(blob, { status: 200, headers }));
    return blob.size;
  }

  /** Retry a missing same-origin /media file from the configured API and cache it under its page URL. */
  private async fetchAsset(assetUrl: string): Promise<Response> {
    const candidates = [assetUrl];
    try {
      const pageAsset = new URL(assetUrl, location.origin);
      const api = new URL(this.apiOrigin(), location.origin);
      if (
        pageAsset.origin === location.origin &&
        pageAsset.pathname.startsWith("/media/") &&
        api.origin !== pageAsset.origin
      ) {
        candidates.push(new URL(`${pageAsset.pathname}${pageAsset.search}`, api.origin).href);
      }
    } catch {}

    let lastError: Error | undefined;
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, {
          headers: this.headersFor(candidate),
          signal: this.controller?.signal,
        });
        if (response.ok) return response;
        lastError = new Error(`${response.status}`);
      } catch (cause) {
        lastError = cause instanceof Error ? cause : new Error(String(cause));
        if (lastError.name === "AbortError") throw lastError;
      }
    }
    const status = lastError?.message.match(/^\d+$/)?.[0];
    throw new Error(`${status ? `download failed (${status})` : "download could not connect"}.`);
  }

  private async save(): Promise<void> {
    if (this.busy || !this.manifest || typeof caches === "undefined") {
      if (typeof caches === "undefined") {
        this.error = true;
        this.status =
          "Offline storage is unavailable in this browser. Open the site over HTTPS or localhost.";
      }
      return;
    }

    const assets = buildLessonPackAssets(this.manifest, this.apiOrigin(), location.origin);
    if (!assets.length) {
      this.error = true;
      this.status = "This lesson has no downloadable media assets.";
      return;
    }

    this.busy = true;
    this.error = false;
    this.progress = 0;
    this.controller = new AbortController();
    let cache: Cache | undefined;
    try {
      cache = await caches.open(this.cacheName());
      const urls = assets.map((asset) => asset.url);
      await this.checkAvailableStorage(cache, urls, this.manifest.sizeBytes || 0);

      const metadataUrl = new URL(
        `/savanna-offline/${encodeURIComponent(this.lessonId)}/manifest.json`,
        location.origin,
      ).href;
      const metadata = new Response(JSON.stringify({ ...this.manifest, id: this.lessonId }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
      await cache.put(metadataUrl, metadata);
      await cache.put(
        this.lessonUrl(),
        new Response(JSON.stringify(this.manifest), {
          headers: { "Content-Type": "application/json" },
        }),
      );

      const total = this.manifest.sizeBytes || 0;
      let completed = 0;
      for (const asset of assets) {
        const bytes = await this.saveAsset(cache, asset.url, asset.kind, total, completed);
        completed += bytes;
      }

      const prefs = readOfflinePreferences();
      prefs.savedLessons = [...new Set([...prefs.savedLessons, this.lessonId])];
      prefs.incompleteLessons = prefs.incompleteLessons.filter((id) => id !== this.lessonId);
      writeOfflinePreferences(prefs);
      this.saved = true;
      this.incomplete = false;
      this.progress = 100;
      this.error = false;
      this.status = `${this.text("Saved offline", "ከመስመር ውጭ ተቀምጧል")} · ${this.size(completed)}. ${this.text("Refresh this lesson page once while online to activate offline playback.", "ከመስመር ውጭ ለማጫወት ኢንተርኔት እያለ ይህን ገጽ አንድ ጊዜ ያድሱ።")}`;
    } catch (cause) {
      const prefs = readOfflinePreferences();
      prefs.incompleteLessons = [...new Set([...prefs.incompleteLessons, this.lessonId])];
      try {
        writeOfflinePreferences(prefs);
      } catch {}
      this.incomplete = true;
      this.saved = false;
      this.error = true;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (error.name === "AbortError") {
        this.status = "Download interrupted. Completed files are kept; retry to continue.";
      } else if (error.name === "QuotaExceededError" || /quota|storage/i.test(error.message)) {
        this.status =
          "Not enough browser storage. Remove an offline copy or free device space, then retry.";
      } else {
        this.status = `${error.message} Completed files are kept so a retry can continue.`;
      }
    } finally {
      this.controller = undefined;
      this.busy = false;
    }
  }

  private cancel(): void {
    this.controller?.abort();
  }

  private async removeOfflineCopy(): Promise<void> {
    if (this.busy) return;
    if (typeof caches !== "undefined") await caches.delete(this.cacheName()).catch(() => false);
    const prefs = readOfflinePreferences();
    prefs.savedLessons = prefs.savedLessons.filter((id) => id !== this.lessonId);
    prefs.incompleteLessons = prefs.incompleteLessons.filter((id) => id !== this.lessonId);
    try {
      writeOfflinePreferences(prefs);
      this.saved = false;
      this.incomplete = false;
      this.progress = 0;
      this.error = false;
      this.status = this.text(
        "Offline copy removed from this device.",
        "ከመስመር ውጭ የተቀመጠው ቅጂ ከዚህ መሣሪያ ተወግዷል።",
      );
    } catch (cause) {
      this.error = true;
      this.status =
        cause instanceof Error ? cause.message : "The offline status could not be updated.";
    }
  }

  private renderAssets() {
    if (!this.manifest) return "";
    const assetKinds = buildLessonPackAssets(this.manifest, this.apiOrigin(), location.origin).map(
      (asset) => asset.kind,
    );
    return html`<p class="summary" dir="auto">
      ${this.text("Includes", "የተካተቱ ፋይሎች")}:
      ${assetKinds.join(", ")}${!this.manifest.audioDescription ? ` · ${this.text("Audio description not supplied", "የድምጽ ማብራሪያ አልቀረበም")}` : ""}${!this.manifest.sign ? ` · ${this.text("Sign video not supplied", "የምልክት ቪዲዮ አልቀረበም")}` : ""}
      · ${this.size(this.manifest.sizeBytes || 0)}
    </p>`;
  }

  render() {
    const downloadLabel = this.incomplete
      ? this.text("Retry offline download", "የከመስመር ውጭ ማውረድን እንደገና ሞክር")
      : this.text("Download offline pack", "የከመስመር ውጭ ጥቅል አውርድ");
    return html`
      ${this.renderAssets()}
      <div class="row">
        ${
          this.saved
            ? html`<button
                type="button"
                class="secondary"
                @click=${this.removeOfflineCopy}
                ?disabled=${this.busy}
                aria-label=${this.text("Delete offline copy", "ከመስመር ውጭ የተቀመጠውን ሰርዝ")}
              >
                ${this.text("Delete offline copy", "ከመስመር ውጭ የተቀመጠውን ሰርዝ")}
              </button>`
            : html`<button
                type="button"
                @click=${this.save}
                ?disabled=${this.busy || !this.manifest}
                aria-label=${downloadLabel}
              >
                ${this.busy ? this.text("Downloading…", "በማውረድ ላይ…") : downloadLabel}
              </button>`
        }
        ${
          this.busy
            ? html`<button
                type="button"
                class="secondary"
                @click=${this.cancel}
                aria-label=${this.text("Cancel download", "ማውረድን አቋርጥ")}
              >
                ${this.text("Cancel", "አቋርጥ")}
              </button>`
            : html`<button
                type="button"
                class="secondary"
                @click=${this.refresh}
              >
                ${this.text("Refresh info", "መረጃ አድስ")}
              </button>`
        }
      </div>
      ${
        this.busy
          ? html`<progress
                max="100"
                .value=${this.progress}
                aria-label=${this.text(`Download progress ${this.progress} percent`, `የማውረድ ሂደት ${this.progress} በመቶ`)}
              ></progress>
              <p class="progress-text">${this.progress}%</p>`
          : ""
      }
      <p
        class="status ${this.error ? "error" : this.saved ? "success" : ""}"
        role="status"
        aria-live="polite"
      >
        ${this.status}
      </p>
      <p class="note">
        ${this.text("Files are kept in this browser’s storage. Open the same lesson page after refreshing once online to use a saved copy without a connection.", "ፋይሎቹ በዚህ አሳሽ ማከማቻ ውስጥ ይቀመጣሉ። ከመስመር ውጭ ለመጠቀም ኢንተርኔት እያለ ገጹን አንድ ጊዜ ካደሱ በኋላ ያንኑ የትምህርት ገጽ ይክፈቱ።")}
      </p>
    `;
  }
}
