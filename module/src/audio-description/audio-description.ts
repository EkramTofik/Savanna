import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseWebVtt, type VttCue } from '../player/vtt-parser.js';
import { fetchCaptionTrack, resolveCaptionUrl } from '../player/caption-loader.js';

const PREFERENCES_KEY = 'savanna.prefs.v1';

type DescriptionMode = 'audio' | 'text';

interface AudioDescriptionPreferences {
  enabled: boolean;
  extended: boolean;
  mode: DescriptionMode;
}

interface PlayerTimeDetail {
  time: number;
  paused: boolean;
  rate: number;
}

interface PlayerElement extends HTMLElement {
  media?: HTMLMediaElement;
}

const COPY = {
  en: {
    on: 'Audio description is on.',
    off: 'Audio description is off.',
    unavailable: 'Recorded audio description is not available for this lesson.',
    textUnavailable: 'Text descriptions are not available for this lesson.',
    loading: 'Loading text descriptions.',
    loadError: 'Text description could not be loaded. Check your connection and retry.',
    playing: 'Audio description playing.',
    playBlocked: 'Audio description is ready. Press Play description to start it.',
    paused: 'Audio description paused with the lesson.',
    stopped: 'Audio description stopped.',
    finished: 'Description finished.',
    failed: 'Recorded description failed to load.',
    mode: 'Mode',
    recorded: 'Recorded audio',
    text: 'Text descriptions',
    play: 'Play description',
    stop: 'Stop',
    extended: 'Extended AD (pause the lesson video)',
  },
  am: {
    on: 'የድምፅ መግለጫ በርቷል።',
    off: 'የድምፅ መግለጫ ጠፍቷል።',
    unavailable: 'ለዚህ ትምህርት የተቀዳ የድምፅ መግለጫ የለም።',
    textUnavailable: 'ለዚህ ትምህርት የጽሑፍ መግለጫ የለም።',
    loading: 'የጽሑፍ መግለጫዎች በመጫን ላይ ናቸው።',
    loadError: 'የጽሑፍ መግለጫው መጫን አልቻለም። ግንኙነቱን ያረጋግጡና እንደገና ይሞክሩ።',
    playing: 'የድምፅ መግለጫ በመጫወት ላይ ነው።',
    playBlocked: 'የድምፅ መግለጫው ዝግጁ ነው። ለመጀመር የመግለጫ አጫውትን ይጫኑ።',
    paused: 'የድምፅ መግለጫው ከትምህርቱ ጋር ቆሟል።',
    stopped: 'የድምፅ መግለጫው ቆሟል።',
    finished: 'መግለጫው ተጠናቋል።',
    failed: 'የተቀዳው መግለጫ መጫወት አልቻለም።',
    mode: 'የመግለጫ ሁኔታ',
    recorded: 'የተቀዳ ድምፅ',
    text: 'የጽሑፍ መግለጫዎች',
    play: 'መግለጫውን አጫውት',
    stop: 'አቁም',
    extended: 'የተራዘመ የድምፅ መግለጫ (የትምህርቱን ቪዲዮ ያቆማል)',
  },
} as const;

function storedPreferences(): { value: AudioDescriptionPreferences; hasExtended: boolean } {
  const fallback: AudioDescriptionPreferences = { enabled: false, extended: false, mode: 'audio' };
  try {
    const root = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    const stored = root?.ad;
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return { value: fallback, hasExtended: false };
    }
    return {
      value: {
        enabled: typeof stored.enabled === 'boolean' ? stored.enabled : false,
        extended: typeof stored.extended === 'boolean' ? stored.extended : false,
        mode: stored.mode === 'text' ? 'text' : 'audio',
      },
      hasExtended: typeof stored.extended === 'boolean',
    };
  } catch {
    return { value: fallback, hasExtended: false };
  }
}

@customElement('savanna-audio-description')
export class SavannaAudioDescription extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: inherit;
      font: 16px/1.5 system-ui, sans-serif;
    }

    :host([hidden]) {
      display: none !important;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    button,
    select {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid #72548a;
      border-radius: 8px;
      background: #fff;
      color: #241b2b;
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 3px solid #9a5b00;
      outline-offset: 2px;
    }

    .ad-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 3px 10px;
      border-radius: 16px;
      background: #176b2c;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }

    .ad-badge-off {
      background: #4b5563;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (forced-colors: active) {
      :host {
        color: CanvasText;
      }

      button,
      select {
        forced-color-adjust: auto;
        border-color: ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }

      .ad-badge,
      .ad-badge-off {
        border: 1px solid ButtonText;
        background: Canvas;
        color: CanvasText;
      }

      button:focus-visible,
      select:focus-visible,
      input:focus-visible {
        outline-color: Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  @property() src = '';
  @property({ type: String, attribute: 'text-vtt' }) textVtt = '';
  @property({ type: Number, attribute: 'offset-ms' }) offsetMs = 0;
  @property() api = '';
  @property({ attribute: 'api-key' }) apiKey = '';
  @property() lang = '';
  @property({ type: Boolean, attribute: 'default-extended' }) defaultExtended = false;

  @state() private preferences = storedPreferences().value;
  @state() private status: string = COPY.en.off;
  @state() private cues: VttCue[] = [];
  @state() private activeText = '';

  private hasStoredExtended = storedPreferences().hasExtended;
  private player?: PlayerElement;
  private media?: HTMLMediaElement;
  private textLoadController?: AbortController;
  private wasPlaying = false;
  private pausingForExtended = false;

  private get audio(): HTMLAudioElement | null {
    return this.renderRoot.querySelector('audio');
  }

  private get copy() {
    return this.lang.toLowerCase().startsWith('am') ? COPY.am : COPY.en;
  }

  private get extended(): boolean {
    return this.hasStoredExtended ? this.preferences.extended : this.defaultExtended;
  }

  public get isEnabled(): boolean {
    return this.preferences.enabled;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.bindPlayer();
    this.player?.addEventListener('savanna:ready', this.bindPlayer);
    this.player?.addEventListener('savanna:timeupdate', this.handleTimeUpdate as EventListener);
    this.player?.addEventListener('savanna:seek', this.handleSeek as EventListener);
    this.player?.addEventListener('savanna:pause', this.handlePlayerPause);
    this.player?.addEventListener('savanna:play', this.handlePlayerPlay);
  }

  override disconnectedCallback(): void {
    this.textLoadController?.abort();
    this.player?.removeEventListener('savanna:ready', this.bindPlayer);
    this.player?.removeEventListener('savanna:timeupdate', this.handleTimeUpdate as EventListener);
    this.player?.removeEventListener('savanna:seek', this.handleSeek as EventListener);
    this.player?.removeEventListener('savanna:pause', this.handlePlayerPause);
    this.player?.removeEventListener('savanna:play', this.handlePlayerPlay);
    this.stop(false, false);
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this.bindPlayer();
    if (this.textVtt) void this.loadTextDescriptions();
  }

  protected override updated(changed: Map<string, unknown>): void {
    if (changed.has('textVtt') && this.textVtt) void this.loadTextDescriptions();
    if (changed.has('src')) this.audio?.load();
  }

  private bindPlayer = (): void => {
    this.player = this.closest('savanna-player') as PlayerElement | null ?? undefined;
    this.media = this.player?.media;
  };

  private persist(): void {
    try {
      const raw = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
      const root = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
      root.ad = this.preferences;
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(root));
    } catch {
      // Preferences remain active for this page when storage is unavailable.
    }
  }

  private emitState(): void {
    this.dispatchEvent(new CustomEvent('savanna:ad-change', {
      bubbles: true,
      composed: true,
      detail: { enabled: this.preferences.enabled, mode: this.preferences.mode },
    }));
  }

  private async loadTextDescriptions(): Promise<void> {
    this.textLoadController?.abort();
    if (!this.textVtt) {
      this.cues = [];
      return;
    }

    const controller = new AbortController();
    this.textLoadController = controller;
    try {
      const url = resolveCaptionUrl({ urlPath: this.textVtt, apiBase: this.api });
      const result = await fetchCaptionTrack({
        url,
        apiKey: this.apiKey,
        apiBase: this.api,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      this.cues = parseWebVtt(result.text);
      if (this.cues.length === 0) throw new Error('No timed descriptions were found.');
    } catch {
      if (controller.signal.aborted) return;
      this.cues = [];
      this.status = this.copy.loadError;
      this.dispatchEvent(new CustomEvent('savanna:error', {
        bubbles: true,
        composed: true,
        detail: { feature: 'audio-description-text', message: this.status },
      }));
    }
  }

  /** Called by the owning player for its D shortcut; the component installs no global key listener. */
  public toggle(): void {
    void this.setEnabled(!this.preferences.enabled);
  }

  public async setEnabled(enabled: boolean): Promise<void> {
    if (!enabled) {
      this.stop();
      return;
    }

    if (this.preferences.mode === 'text') {
      if (!this.cues.length) {
        this.status = this.copy.loading;
        await this.loadTextDescriptions();
      }
      if (!this.cues.length) {
        this.status = this.copy.textUnavailable;
        return;
      }
      this.preferences = { ...this.preferences, enabled: true };
      this.persist();
      this.emitState();
      this.status = this.activeText || this.copy.on;
      return;
    }

    if (!this.src || !this.audio) {
      this.status = this.copy.unavailable;
      return;
    }

    this.bindPlayer();
    this.wasPlaying = Boolean(this.media && !this.media.paused);
    this.preferences = { ...this.preferences, enabled: true };
    this.persist();
    this.emitState();

    const targetTime = Math.max(0, (this.media?.currentTime ?? 0) - this.offsetMs / 1000);
    this.audio.currentTime = targetTime;
    this.audio.playbackRate = this.media?.playbackRate || 1;

    if (this.extended && this.wasPlaying && this.media && !this.media.paused) {
      this.pausingForExtended = true;
      this.media.pause();
    }

    try {
      await this.audio.play();
      this.status = this.copy.playing;
    } catch {
      this.status = this.copy.playBlocked;
    }
  }

  private handleTimeUpdate = (event: Event): void => {
    const detail = (event as CustomEvent<PlayerTimeDetail>).detail;
    if (!detail || !Number.isFinite(detail.time)) return;

    if (!this.preferences.enabled) return;
    if (this.preferences.mode === 'text') {
      const cue = this.cues.find((item) => detail.time >= item.start && detail.time < item.end);
      if (cue && cue.text !== this.activeText) {
        this.activeText = cue.text;
        this.status = cue.text;
      } else if (!cue && this.activeText) {
        this.activeText = '';
      }
      return;
    }

    const audio = this.audio;
    if (!audio || !this.src) return;
    if (this.extended && this.wasPlaying && detail.paused) return;

    const targetTime = Math.max(0, detail.time - this.offsetMs / 1000);
    if (Math.abs(audio.currentTime - targetTime) > 0.45) {
      try {
        audio.currentTime = targetTime;
      } catch {
        // Some media elements cannot seek until metadata is loaded.
      }
    }
    audio.playbackRate = detail.rate || 1;
    if (detail.paused) {
      audio.pause();
    } else if (audio.paused) {
      void audio.play().catch(() => {
        this.status = this.copy.playBlocked;
      });
    }
  };

  private handleSeek = (event: Event): void => {
    const detail = (event as CustomEvent<{ time?: number }>).detail;
    if (typeof detail?.time !== 'number' || !this.audio || this.preferences.mode !== 'audio') return;
    try {
      this.audio.currentTime = Math.max(0, detail.time - this.offsetMs / 1000);
    } catch {
      // The next timeupdate will retry after metadata is ready.
    }
  };

  private handlePlayerPause = (): void => {
    if (this.pausingForExtended) {
      this.pausingForExtended = false;
      return;
    }
    if (this.preferences.enabled && this.preferences.mode === 'audio') {
      this.audio?.pause();
      this.wasPlaying = false;
      this.status = this.copy.paused;
    }
  };

  private handlePlayerPlay = (): void => {
    if (!this.preferences.enabled || this.preferences.mode !== 'audio' || this.extended) return;
    this.bindPlayer();
    if (this.media) this.syncAudioToPlayer(this.media.currentTime);
    void this.audio?.play().catch(() => {
      this.status = this.copy.playBlocked;
    });
  };

  private syncAudioToPlayer(time: number): void {
    if (!this.audio) return;
    try {
      this.audio.currentTime = Math.max(0, time - this.offsetMs / 1000);
    } catch {
      // The first timeupdate retries once metadata is available.
    }
    this.audio.playbackRate = this.media?.playbackRate || 1;
  }

  private stop(persist = true, updateStatus = true): void {
    this.audio?.pause();
    const shouldResume = this.extended && this.wasPlaying;
    this.wasPlaying = false;
    if (persist) {
      this.preferences = { ...this.preferences, enabled: false };
      this.persist();
      this.emitState();
    }
    if (shouldResume && this.media?.paused) void this.media.play().catch(() => undefined);
    if (updateStatus) this.status = this.copy.stopped;
  }

  private handleDescriptionEnded = (): void => {
    const shouldResume = this.extended && this.wasPlaying;
    this.wasPlaying = false;
    this.preferences = { ...this.preferences, enabled: false };
    this.persist();
    this.emitState();
    if (shouldResume && this.media?.paused) void this.media.play().catch(() => undefined);
    this.status = this.copy.finished;
  };

  private handleAudioError = (): void => {
    this.status = this.copy.failed;
    this.dispatchEvent(new CustomEvent('savanna:error', {
      bubbles: true,
      composed: true,
      detail: { feature: 'audio-description-audio', message: this.status },
    }));
  };

  private changeMode(mode: DescriptionMode): void {
    if (this.preferences.mode === mode) return;
    const wasEnabled = this.preferences.enabled;
    this.audio?.pause();
    this.preferences = { ...this.preferences, mode, enabled: false };
    this.persist();
    this.emitState();
    this.status = mode === 'text' ? this.copy.loading : this.copy.off;
    if (mode === 'text') void this.loadTextDescriptions();
    else if (wasEnabled) void this.setEnabled(true);
  }

  private changeExtended(value: boolean): void {
    this.hasStoredExtended = true;
    this.preferences = { ...this.preferences, extended: value };
    this.persist();
    if (value && this.preferences.enabled && this.audio && !this.audio.paused && this.media && !this.media.paused) {
      this.wasPlaying = true;
      this.pausingForExtended = true;
      this.media.pause();
    }
  }

  protected override render() {
    const t = this.copy;
    const badge = this.preferences.enabled
      ? html`<span class="ad-badge" role="status"><span aria-hidden="true">🔊</span> AD ON</span>`
      : html`<span class="ad-badge ad-badge-off" aria-label=${t.off}>AD OFF</span>`;

    return html`
      <div class="controls" lang=${this.lang || 'en'}>
        ${badge}
        <button
          type="button"
          aria-pressed=${String(this.preferences.enabled)}
          aria-label=${this.preferences.enabled ? t.on : t.off}
          @click=${() => this.toggle()}
        >
          ${this.preferences.enabled ? t.on : t.off}
        </button>
        <label>
          ${t.mode}
          <select .value=${this.preferences.mode} @change=${(event: Event) => this.changeMode((event.target as HTMLSelectElement).value as DescriptionMode)}>
            <option value="audio">${t.recorded}</option>
            <option value="text">${t.text}</option>
          </select>
        </label>
        <button type="button" @click=${() => void this.setEnabled(true)}>${t.play}</button>
        <button type="button" @click=${() => this.stop()}>${t.stop}</button>
        <label>
          <input
            type="checkbox"
            .checked=${this.extended}
            @change=${(event: Event) => this.changeExtended((event.target as HTMLInputElement).checked)}
          />
          ${t.extended}
        </label>
      </div>
      ${this.src ? html`<audio preload="metadata" src=${this.src} @ended=${this.handleDescriptionEnded} @error=${this.handleAudioError}></audio>` : nothing}
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${this.status}</p>
      ${this.activeText ? html`<p lang=${this.lang || 'en'}>${this.activeText}</p>` : nothing}
    `;
  }
}
