import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { parseWebVtt } from "../player/vtt-parser.js";
import { activeAudioDescriptionCue, type AudioDescriptionCue } from "./sync.js";
const KEY = "savanna.prefs.v1";
function prefs() {
  try {
    return {
      enabled: false,
      extended: false,
      mode: "audio",
      ...JSON.parse(localStorage.getItem(KEY) || "{}").ad,
    };
  } catch {
    return { enabled: false, extended: false, mode: "audio" };
  }
}
@customElement("savanna-audio-description")
export class SavannaAudioDescription extends LitElement {
  static styles = css`
    :host([hidden]) {
      display: none !important;
    }
    :host {
      display: block;
      font: 16px/1.5 system-ui;
      color: inherit;
    }
    button,
    select {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid #72548a;
      border-radius: 8px;
      background: white;
      color: #241b2b;
      font: inherit;
    }
    button:focus-visible,
    select:focus-visible {
      outline: 3px solid #e09b00;
      outline-offset: 2px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .ad-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      background: #4caf50;
      color: white;
      font-size: 13px;
      font-weight: 700;
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .ad-badge-off {
      background: #666;
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
  @property() src = "";
  @property({ attribute: "text-vtt" }) textVtt = "";
  @property({ type: Number, attribute: "offset-ms" }) offsetMs = 0;
  @state() private p = prefs();
  @state() private status = "Audio description is off.";
  @state() private cues: AudioDescriptionCue[] = [];
  @state() private active = "";
  private player?: HTMLElement;
  private media?: HTMLMediaElement;
  private audio?: HTMLAudioElement;
  private wasPlaying = false;
  private validationGeneration = 0;
  connectedCallback() {
    super.connectedCallback();
    this.player = this.closest("savanna-player") as HTMLElement | undefined;
    this.media = (this.player as any)?.media;
    this.player?.addEventListener("savanna:timeupdate", this.time as EventListener);
  }
  disconnectedCallback() {
    this.player?.removeEventListener("savanna:timeupdate", this.time as EventListener);
    this.stop(false);
    super.disconnectedCallback();
  }
  firstUpdated() {
    this.audio = this.renderRoot.querySelector("audio") || undefined;
    if (!this.media) {
      this.player = this.closest("savanna-player") as HTMLElement | undefined;
      this.media = (this.player as any)?.media;
    }
  }
  updated(changed: Map<string, unknown>) {
    if (changed.has("src") || changed.has("textVtt") || changed.has("offsetMs"))
      void this.validateTrack();
  }
  private save() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "{}");
      a.ad = this.p;
      localStorage.setItem(KEY, JSON.stringify(a));
    } catch {}
  }
  public async validateTrack(): Promise<boolean> {
    const generation = ++this.validationGeneration;
    this.notifyAvailability(false);
    this.cues = [];
    this.active = "";
    if (!this.src.trim() || !this.textVtt.trim() || !Number.isSafeInteger(this.offsetMs) || this.offsetMs < 0) {
      this.status = "Recorded audio description is not available.";
      return false;
    }

    try {
      const response = await fetch(this.textVtt);
      if (!response.ok) throw Error();
      const cues = parseWebVtt(await response.text()).map(({ start, end, text }) => ({
        start,
        end,
        text,
      }));
      if (generation !== this.validationGeneration) return false;
      if (!cues.length) throw Error("No valid audio-description cues");
      this.cues = cues;
      this.status = "Audio-description timings are ready.";
      this.notifyAvailability(true);
      return true;
    } catch {
      if (generation !== this.validationGeneration) return false;
      this.cues = [];
      this.status = "Audio-description timings could not be loaded.";
      this.notifyAvailability(false);
      return false;
    }
  }
  private notifyAvailability(available: boolean) {
    this.dispatchEvent(
      new CustomEvent("savanna:ad-availability", {
        bubbles: true,
        composed: true,
        detail: { available, enabled: this.p.enabled },
      }),
    );
  }
  /** Called by the owning player for its D shortcut; no competing global listener is installed. */
  public toggle() {
    if (this.p.enabled) this.stop();
    else void this.play();
  }
  private time = (e: Event) => {
    const d = (e as CustomEvent).detail;
    if (!d) return;
    if (this.p.enabled && this.p.mode === "text") {
      const text = activeAudioDescriptionCue(this.cues, d.time, this.offsetMs);
      if (text !== this.active) {
        this.active = text;
        this.status = text || "No audio description at this point.";
      }
    }
    if (this.p.enabled && this.p.mode === "audio" && this.audio && this.src) {
      const target = Math.max(0, d.time - this.offsetMs / 1000);
      if (Math.abs(this.audio.currentTime - target) > 0.45)
        try {
          this.audio.currentTime = target;
        } catch {}
      this.audio.playbackRate = d.rate || 1;
      if (d.paused) {
        this.audio.pause();
      } else if (this.audio.paused) void this.audio.play().catch(() => {});
    }
  };
  private async play() {
    this.p = { ...this.p, enabled: true };
    this.save();
    this.notifyAvailability(true);
    if (this.p.mode === "text") {
      this.status = this.active || "Text descriptions are enabled.";
      return;
    }
    if (!this.src || !this.audio) {
      this.status = "Recorded audio description is not available.";
      this.notifyAvailability(false);
      return;
    }
    if (this.media) {
      this.wasPlaying = !this.media.paused;
      try {
        this.audio.currentTime = Math.max(0, this.media.currentTime - this.offsetMs / 1000);
      } catch {}
      this.audio.playbackRate = this.media.playbackRate;
    }
    try {
      await this.audio.play();
      this.status = "Audio description playing.";
    } catch {
      this.status = "Press Play to start the description.";
    }
  }
  private stop(persist = true) {
    this.audio?.pause();
    if (this.p.extended && this.wasPlaying) void this.media?.play().catch(() => {});
    this.wasPlaying = false;
    if (persist) {
      this.p = { ...this.p, enabled: false };
      this.save();
      this.notifyAvailability(this.cues.length > 0 && Boolean(this.src));
    }
    this.status = "Audio description stopped.";
  }
  private descriptionEnded = () => {
    if (this.p.extended && this.wasPlaying) void this.media?.play().catch(() => {});
    this.wasPlaying = false;
    this.p = { ...this.p, enabled: false };
    this.save();
    this.notifyAvailability(this.cues.length > 0 && Boolean(this.src));
    this.status = "Description finished.";
  };
  private audioError = () => {
    this.validationGeneration += 1;
    this.audio?.pause();
    if (this.p.extended && this.wasPlaying) void this.media?.play().catch(() => {});
    this.wasPlaying = false;
    this.p = { ...this.p, enabled: false };
    this.save();
    this.status = "Recorded description failed to load.";
    this.notifyAvailability(false);
  };
  private extended(v: boolean) {
    this.p = { ...this.p, extended: v };
    this.save();
    if (v && this.audio && !this.audio.paused) {
      this.wasPlaying = !!this.media && !this.media.paused;
      this.media?.pause();
    }
  }
  render() {
    const badge = this.p.enabled
      ? html`<span class="ad-badge" role="status" aria-label="Audio description active"
          >🔊 AD ON</span
        >`
      : html`<span class="ad-badge ad-badge-off" aria-label="Audio description off">AD OFF</span>`;
    return html`<div class="controls">
        ${badge}<button
          type="button"
          aria-pressed=${String(this.p.enabled)}
          aria-label="Audio description ${this.p.enabled ? "on" : "off"}"
          @click=${() => (this.p.enabled ? this.stop() : void this.play())}
        >
          Audio description: ${this.p.enabled ? "On" : "Off"}</button
        ><label
          >Mode
          <select
            .value=${this.p.mode}
            @change=${(e: Event) => {
              this.p = { ...this.p, mode: (e.target as HTMLSelectElement).value };
              this.save();
            }}
          >
            <option value="audio">Recorded audio</option>
            <option value="text">Text descriptions</option>
          </select></label
        ><button @click=${this.play}>Play description</button
        ><button @click=${this.stop}>Stop</button
        ><label
          ><input
            type="checkbox"
            .checked=${this.p.extended}
            @change=${(e: Event) => this.extended((e.target as HTMLInputElement).checked)}
          />
          Extended AD (pause lesson)</label
        >
      </div>
      <audio
        preload="metadata"
        .src=${this.src}
        @play=${() => {
          if (this.p.extended) {
            this.wasPlaying = !!this.media && !this.media.paused;
            this.media?.pause();
          }
        }}
        @ended=${this.descriptionEnded}
        @error=${this.audioError}
      ></audio>
      <p role="status" aria-live="polite">${this.status}</p>`;
  }
}
