
import { LitElement, css, html, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

@customElement('savanna-player')
export class SavannaPlayer extends LitElement {
  @property({ type: String })
  src = '';

  /** Contract C1 / C6: Lesson ID to fetch from the API */
  @property({ type: String })
  lesson = '';

  /** Contract C6: API base URL (e.g. http://localhost:4010) */
  @property({ type: String })
  api = '';

  /** Contract C6: Public publishable API key */
  @property({ type: String, attribute: 'api-key' })
  apiKey = '';

  /** Contract C4: Component language code ('en' | 'am') */
  @property({ type: String })
  lang = 'en';

  /**
   * Allows disabling keyboard shortcuts per WCAG 2.1.4
   * (Character Key Shortcuts) or host application preferences.
   */
  @property({ type: Boolean, attribute: 'disable-shortcuts', reflect: true })
  disableShortcuts = false;

  /** Toggle state for slotted sign language window */
  @property({ type: Boolean, attribute: 'show-sign-window', reflect: true })
  showSignWindow = true;

  /** Toggle state for audio description */
  @property({ type: Boolean, attribute: 'audio-description', reflect: true })
  audioDescriptionEnabled = false;

  /** Whether the on-screen shortcuts help dialog is open */
  @state()
  private showHelpDialog = false;

  /** Caption track list loaded from lesson manifest */
  @state()
  private manifestCaptions: Array<{ lang: string; url: string }> = [];

  /** Temporary on-screen HUD toast message for shortcut confirmation */
  @state()
  private statusToast = '';

  private toastTimeout: number | null = null;

  private showToast(msg: string): void {
    this.statusToast = msg;
    if (this.toastTimeout !== null) {
      window.clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = window.setTimeout(() => {
      this.statusToast = '';
      this.toastTimeout = null;
    }, 1500);
  }

  @query('video')
  private videoElement!: HTMLVideoElement;

  // Expose the real browser media element (Contract C2).
  get media(): HTMLMediaElement {
    return this.videoElement;
  }

  static styles = css`
    :host {
      --savanna-accent: #0f4c81;
      --savanna-focus: #005fcc;
      --savanna-radius: 4px;
      display: block;
      position: relative;
      outline: none;
      border-radius: var(--savanna-radius, 4px);
      box-sizing: border-box;
      cursor: pointer;
    }

    :host(:focus),
    :host(:focus-within),
    :host(:focus-visible) {
      outline: 3px solid var(--savanna-focus, #005fcc) !important;
      outline-offset: 3px;
      box-shadow: 0 0 0 3px var(--savanna-focus, #005fcc);
    }

    @media (forced-colors: active) {
      :host(:focus),
      :host(:focus-within),
      :host(:focus-visible) {
        outline: 3px solid Highlight !important;
      }
    }

    .player {
      position: relative;
      width: 100%;
      background-color: #000000;
      border-radius: var(--savanna-radius, 4px);
      overflow: hidden;
    }

    video {
      display: block;
      width: 100%;
      height: auto;
    }

    .overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    ::slotted(*) {
      pointer-events: auto;
    }

    /* Shortcuts Help Modal Dialog */
    .shortcuts-dialog {
      position: absolute;
      inset: 1rem;
      background: rgba(17, 24, 39, 0.95);
      color: #ffffff;
      border: 2px solid var(--savanna-focus, #005fcc);
      border-radius: var(--savanna-radius, 4px);
      padding: 1.25rem;
      z-index: 100;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .shortcuts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 0.5rem;
    }

    .shortcuts-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #ffffff;
    }

    .close-help-btn {
      background: #ffffff;
      color: #111827;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .close-help-btn:focus-visible {
      outline: 3px solid #facc15;
      outline-offset: 2px;
    }

    .shortcuts-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      color: #f3f4f6;
    }

    .shortcuts-table th,
    .shortcuts-table td {
      padding: 0.35rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .shortcuts-table th {
      background: rgba(255, 255, 255, 0.05);
      font-weight: 600;
    }

    kbd {
      background: #374151;
      border: 1px solid #6b7280;
      border-radius: 3px;
      padding: 2px 5px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.85em;
      color: #f9fafb;
    }

    /* On-Screen HUD Notification Badge */
    .status-toast {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(11, 37, 69, 0.94);
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 1.15rem;
      font-weight: 700;
      pointer-events: none;
      z-index: 150;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
      border: 2px solid rgba(255, 255, 255, 0.35);
      text-align: center;
      min-width: 140px;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    // Allow keyboard users to Tab into the player container if not explicitly configured
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    this.addEventListener('keydown', this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('lesson') || changedProps.has('api')) {
      if (this.lesson && this.api) {
        this.fetchLessonManifest();
      }
    }
  }

  /**
   * Fetches lesson manifest per Contract C1 & C6 and configures media sources.
   */
  private async fetchLessonManifest(): Promise<void> {
    const endpoint = `${this.api.replace(/\/$/, '')}/v1/lessons/${this.lesson}`;
    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['X-Savanna-Key'] = this.apiKey;
      }
      const res = await fetch(endpoint, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch lesson manifest: HTTP ${res.status}`);
      }
      const manifest = await res.json();
      if (manifest?.media?.video) {
        this.src = manifest.media.video;
      }
      if (Array.isArray(manifest?.captions)) {
        this.manifestCaptions = manifest.captions;
      }
    } catch {
      this.emitEvent('savanna:error');
    }
  }

  /**
   * Helper to check if the active element is an editable input or textarea
   * so keyboard shortcuts are safely ignored while typing.
   */
  private isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target.isContentEditable
    );
  }

  /**
   * Accessible keyboard shortcut handler.
   * Shortcuts are active only when the player has focus (on host or inside).
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // If the help dialog is open, let Escape close it regardless of disableShortcuts
    if (this.showHelpDialog) {
      if (event.key === 'Escape' || event.key === '?') {
        event.preventDefault();
        this.toggleShortcutsHelp();
        return;
      }
    }

    if (this.disableShortcuts) {
      return;
    }

    // Do not intercept if browser/OS modifier keys are held (Ctrl, Alt, Meta)
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const target = (event.composedPath()[0] || event.target) as HTMLElement | null;

    // 1. Safety: Ignore all shortcuts if user is typing in form/editable controls
    if (this.isEditableTarget(target)) {
      return;
    }

    // 2. Safety: If focus is on a button, preserve Space and Enter for native button click
    if (target instanceof HTMLButtonElement) {
      if (event.key === ' ' || event.key === 'Enter') {
        return;
      }
    }

    switch (event.key) {
      // Play / Pause (Space or K)
      case ' ':
      case 'k':
      case 'K': {
        event.preventDefault();
        this.togglePlay();
        break;
      }

      // Seeking -5s / +5s (Left / Right Arrow)
      case 'ArrowLeft': {
        event.preventDefault();
        this.seekBy(-5);
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        this.seekBy(5);
        break;
      }

      // Seeking -10s / +10s (J / L)
      case 'j':
      case 'J': {
        event.preventDefault();
        this.seekBy(-10);
        break;
      }

      case 'l':
      case 'L': {
        event.preventDefault();
        this.seekBy(10);
        break;
      }

      // Volume Controls (Up / Down Arrow)
      case 'ArrowUp': {
        event.preventDefault();
        this.changeVolume(0.1);
        break;
      }

      case 'ArrowDown': {
        event.preventDefault();
        this.changeVolume(-0.1);
        break;
      }

      // Mute / Unmute (M)
      case 'm':
      case 'M': {
        event.preventDefault();
        this.toggleMute();
        break;
      }

      // Toggle Captions (C)
      case 'c':
      case 'C': {
        event.preventDefault();
        this.toggleCaptions();
        break;
      }

      // Toggle Sign Window (S)
      case 's':
      case 'S': {
        event.preventDefault();
        this.toggleSignWindow();
        break;
      }

      // Toggle Audio Description (D)
      case 'd':
      case 'D': {
        event.preventDefault();
        this.toggleAudioDescription();
        break;
      }

      // Toggle Fullscreen (F)
      case 'f':
      case 'F': {
        event.preventDefault();
        this.toggleFullscreen();
        break;
      }

      // Keyboard Shortcuts Help (?)
      case '?': {
        event.preventDefault();
        this.toggleShortcutsHelp();
        break;
      }

      // Home: Seek to beginning (clamped to 0)
      case 'Home': {
        event.preventDefault();
        this.seekTo(0);
        break;
      }

      // End: Seek to end of video
      case 'End': {
        event.preventDefault();
        if (this.media && Number.isFinite(this.media.duration)) {
          this.seekTo(this.media.duration);
        }
        break;
      }
    }
  };

  /**
   * Toggles play and pause on the underlying media element.
   */
  public togglePlay(): void {
    if (!this.media) return;
    if (this.media.paused || this.media.ended) {
      this.media.play().catch(() => {});
      this.showToast('Play ▶');
    } else {
      this.media.pause();
      this.showToast('Pause ⏸');
    }
  }

  /**
   * Adjusts the volume by delta (-1.0 to 1.0) and un-mutes if volume increases.
   */
  public changeVolume(delta: number): void {
    if (!this.media) return;
    const current = this.media.volume;
    const next = Math.max(0, Math.min(1, current + delta));
    this.media.volume = Number(next.toFixed(2));
    if (this.media.volume > 0 && this.media.muted) {
      this.media.muted = false;
    }
    const pct = Math.round(this.media.volume * 100);
    this.showToast(`Volume: ${pct}% 🔊`);
  }

  /**
   * Toggles audio mute state on the media element.
   */
  public toggleMute(): void {
    if (!this.media) return;
    this.media.muted = !this.media.muted;
    this.showToast(this.media.muted ? 'Muted 🔇' : 'Unmuted 🔊');
  }

  /**
   * Toggles captions display across available text tracks and fires C2 savanna:caption-change.
   */
  public toggleCaptions(): void {
    if (!this.videoElement) return;
    const tracks = this.videoElement.textTracks ? Array.from(this.videoElement.textTracks) : [];
    if (tracks.length === 0) {
      this.showToast('No Captions Track');
      return;
    }

    const anyShowing = tracks.some(t => t.mode === 'showing');
    if (anyShowing) {
      tracks.forEach(t => (t.mode = 'hidden'));
      this.showToast('Captions: OFF');
    } else {
      // Find track matching active language or default to first track
      const preferred = tracks.find(t => t.language === this.lang) || tracks[0];
      if (preferred) {
        preferred.mode = 'showing';
        this.showToast(`Captions: ${preferred.label || preferred.language || 'ON'}`);
      }
    }
    this.emitEvent('savanna:caption-change');
  }

  /**
   * Toggles sign window visibility on any slotted sign window component.
   */
  public toggleSignWindow(): void {
    this.showSignWindow = !this.showSignWindow;
    const signElement = this.querySelector(
      'savanna-sign-window, [data-sign-window]'
    ) as HTMLElement | null;
    if (signElement) {
      signElement.hidden = !this.showSignWindow;
    }
    this.showToast(
      this.showSignWindow ? 'Sign Window: Visible 🤟' : 'Sign Window: Hidden'
    );
  }

  /**
   * Toggles audio description state on any slotted/child audio description element.
   */
  public toggleAudioDescription(): void {
    this.audioDescriptionEnabled = !this.audioDescriptionEnabled;
    const adAudio = this.querySelector(
      'audio[data-ad], audio.ad-track'
    ) as HTMLAudioElement | null;
    if (adAudio) {
      adAudio.muted = !this.audioDescriptionEnabled;
      if (this.audioDescriptionEnabled && this.media && !this.media.paused) {
        adAudio.currentTime = this.media.currentTime;
        adAudio.play().catch(() => {});
      } else {
        adAudio.pause();
      }
    }
    this.showToast(
      this.audioDescriptionEnabled ? 'Audio Description: ON 🎙️' : 'Audio Description: OFF'
    );
  }

  /**
   * Toggles fullscreen on the player container.
   */
  public toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      this.requestFullscreen().catch(() => {
        if (this.videoElement && this.videoElement.requestFullscreen) {
          this.videoElement.requestFullscreen().catch(() => {});
        }
      });
    }
  }

  /**
   * Displays or closes the keyboard shortcuts help dialog.
   */
  public toggleShortcutsHelp(): void {
    this.showHelpDialog = !this.showHelpDialog;
  }

  /**
   * Seeks relatively by a given number of seconds.
   */
  public seekBy(deltaSeconds: number): void {
    if (!this.media) return;
    const duration = Number.isFinite(this.media.duration) ? this.media.duration : Infinity;
    const newTime = Math.max(0, Math.min(this.media.currentTime + deltaSeconds, duration));
    this.media.currentTime = newTime;
    this.showToast(deltaSeconds > 0 ? `+${deltaSeconds}s ⏩` : `${deltaSeconds}s ⏪`);
  }

  /**
   * Seeks to an absolute timestamp in seconds.
   */
  public seekTo(targetSeconds: number): void {
    if (!this.media) return;
    const duration = Number.isFinite(this.media.duration) ? this.media.duration : 0;
    const newTime = Math.max(0, Math.min(targetSeconds, duration));
    this.media.currentTime = newTime;
  }

  // Dispatch events that other components can listen to (Contract C2).
  private emitEvent(
    eventName: string,
    detail?: Record<string, unknown>,
  ): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  // 1. Video starts playing.
  private handlePlay = (): void => {
    this.emitEvent('savanna:play');
  };

  // 2. Video is paused.
  private handlePause = (): void => {
    this.emitEvent('savanna:pause');
  };

  // 3. User seeks to another position (Contract C2: detail.time in seconds).
  private handleSeek = (): void => {
    this.emitEvent('savanna:seek', {
      time: this.media ? this.media.currentTime : 0,
    });
  };

  // 4. Playback position changes (Contract C2: detail: { time, paused, rate }).
  private handleTimeUpdate = (): void => {
    this.emitEvent('savanna:timeupdate', {
      time: this.media.currentTime,
      paused: this.media.paused,
      rate: this.media.playbackRate,
    });
  };

  // 5. Active caption track changes.
  private handleCaptionChange = (): void => {
    this.emitEvent('savanna:caption-change');
  };

  // 6. Video encounters an error.
  private handleError = (): void => {
    this.emitEvent('savanna:error');
  };

  // Runs after Lit completes the first render.
  protected firstUpdated(): void {
    this.videoElement.textTracks.addEventListener(
      'change',
      this.handleCaptionChange,
    );

    if (this.lesson && this.api) {
      this.fetchLessonManifest();
    }

    this.emitEvent('savanna:ready');
  }

  render() {
    return html`
      <div class="player" @click=${() => this.focus()}>
        <video
          controls
          src=${this.src}
          @play=${this.handlePlay}
          @pause=${this.handlePause}
          @seeking=${this.handleSeek}
          @timeupdate=${this.handleTimeUpdate}
          @error=${this.handleError}
        >
          ${this.manifestCaptions.map(
            (c) => html`
              <track
                kind="subtitles"
                srclang=${c.lang}
                src=${c.url}
                label=${c.lang === 'am' ? 'Amharic' : 'English'}
                ?default=${c.lang === this.lang}
              />
            `
          )}
        </video>

        <div class="overlay">
          <slot name="overlay"></slot>
        </div>

        ${this.statusToast
          ? html`<div class="status-toast" role="status" aria-live="polite">${this.statusToast}</div>`
          : ''}

        ${this.showHelpDialog
          ? html`
              <div
                class="shortcuts-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard Shortcuts Help"
              >
                <div class="shortcuts-header">
                  <h3>Keyboard Shortcuts</h3>
                  <button
                    class="close-help-btn"
                    @click=${this.toggleShortcutsHelp}
                    aria-label="Close keyboard shortcuts dialog"
                  >
                    Close (Esc)
                  </button>
                </div>
                <table class="shortcuts-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><kbd>Space</kbd> or <kbd>K</kbd></td><td>Play / Pause</td></tr>
                    <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Seek backward / forward 5 seconds</td></tr>
                    <tr><td><kbd>J</kbd> / <kbd>L</kbd></td><td>Seek backward / forward 10 seconds</td></tr>
                    <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Increase / decrease volume (10%)</td></tr>
                    <tr><td><kbd>M</kbd></td><td>Mute / Unmute audio</td></tr>
                    <tr><td><kbd>C</kbd></td><td>Toggle Captions (CC)</td></tr>
                    <tr><td><kbd>S</kbd></td><td>Show / Hide sign-language window</td></tr>
                    <tr><td><kbd>D</kbd></td><td>Toggle audio description</td></tr>
                    <tr><td><kbd>F</kbd></td><td>Toggle fullscreen</td></tr>
                    <tr><td><kbd>?</kbd></td><td>Show / hide this shortcuts list</td></tr>
                    <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Seek to start / end of lesson</td></tr>
                  </tbody>
                </table>
              </div>
            `
          : ''}
      </div>
    `;
  }
}
