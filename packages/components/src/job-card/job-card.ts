import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";
import am from "./i18n/am.json";
import en from "./i18n/en.json";
import { readJobsPrefs, resolveLang, writeJobsPrefs } from "./prefs.js";

type Strings = typeof en;

type JobPayload = {
  id: string;
  title: string;
  employer: string;
  location: string;
  remote: boolean;
  payText?: string | null;
  validThrough?: string | null;
  applyUrl: string;
  description: {
    en: string;
    am: string;
    requirements?: { en: string[]; am: string[] };
  };
  audioSummary: {
    en: { url: string; durationSec: number; transcript: string };
    am: { url: string; durationSec: number; transcript: string };
  };
};

@customElement("savanna-job-card")
export class SavannaJobCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #111;
      font-family: var(--savanna-font, "Segoe UI", system-ui, sans-serif);
      --_accent: var(--savanna-accent, #0b5cab);
      --_radius: var(--savanna-radius, 0.5rem);
      --_focus: var(--savanna-focus, #0b5cab);
      max-width: 100%;
    }
    article {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid #222;
      border-radius: var(--_radius);
      background: #fff;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    dl {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.35rem;
      margin: 0;
    }
    dt {
      font-weight: 700;
    }
    dd {
      margin: 0 0 0.5rem;
      overflow-wrap: anywhere;
    }
    ul {
      margin: 0;
      padding-inline-start: 1.2rem;
    }
    button,
    a.action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 44px;
      padding: 0.5rem 1rem;
      margin: 0 0.5rem 0.5rem 0;
      font: inherit;
      color: #fff;
      background: var(--_accent);
      border: 0;
      border-radius: var(--_radius);
      text-decoration: none;
      cursor: pointer;
    }
    button[aria-pressed="true"] {
      background: #111;
    }
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--_focus);
      outline-offset: 3px;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
    }
    audio {
      display: none;
    }
    summary {
      min-height: 44px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .transcript {
      margin: 0;
      padding: 0.75rem;
      background: #f4f4f4;
      border-left: 4px solid var(--_accent);
      overflow-wrap: anywhere;
    }
    [role="status"] {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    .wrap {
      position: relative;
    }
    @media (forced-colors: active) {
      article {
        border: 2px solid ButtonText;
      }
      button,
      a.action {
        border: 2px solid ButtonText;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `;

  @property({ type: String }) job = "";
  @property({ type: String }) api = "";
  @property({ attribute: "api-key" }) apiKey = "";
  @property({ type: String }) lang = "";

  @state() private data: JobPayload | null = null;
  @state() private error = false;
  @state() private playing = false;
  @state() private live = "";

  private audioRef = createRef<HTMLAudioElement>();
  private request?: AbortController;
  private hasLoaded = false;

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("savanna:lang-change", this.onLang);
    if (this.hasLoaded) void this.load();
  }

  disconnectedCallback(): void {
    window.removeEventListener("savanna:lang-change", this.onLang);
    this.request?.abort();
    this.audioRef.value?.pause();
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues<this>): void {
    if (
      !this.hasLoaded ||
      changed.has("job") ||
      changed.has("api") ||
      changed.has("apiKey")
    ) {
      this.hasLoaded = true;
      void this.load();
    }
  }

  private onLang = (ev: Event) => {
    const lang = (ev as CustomEvent<{ lang?: string }>).detail?.lang;
    if (lang) this.lang = lang;
  };

  private t(key: keyof Strings): string {
    const pack = this.activeLang() === "am" ? am : en;
    return pack[key];
  }

  private activeLang(): "en" | "am" {
    return resolveLang(this, this.lang);
  }

  private apiRoot(): string {
    return (this.api || "").replace(/\/$/, "");
  }

  private async load(): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.error = false;
    this.data = null;
    if (!this.job) return;
    try {
      const url = `${this.apiRoot()}/v1/jobs/${encodeURIComponent(this.job)}`;
      const res = await fetch(url, {
        headers: { "X-Savanna-Key": this.apiKey },
        signal: request.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.data = (await res.json()) as JobPayload;
      writeJobsPrefs({ lastJobId: this.job });
      this.injectJsonLd();
      this.dispatchEvent(
        new CustomEvent("savanna:ready", {
          bubbles: true,
          composed: true,
          detail: { job: this.job },
        }),
      );
    } catch (error) {
      if (request.signal.aborted) return;
      this.error = true;
      this.dispatchEvent(
        new CustomEvent("savanna:error", {
          bubbles: true,
          composed: true,
          detail: {
            job: this.job,
            message: error instanceof Error ? error.message : "Unable to load job",
          },
        }),
      );
    }
  }

  private injectJsonLd(): void {
    const existing = this.querySelector('script[data-savanna="jobposting"]');
    existing?.remove();
    if (!this.data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.savanna = "jobposting";
    const job = this.data;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      identifier: job.id,
      title: job.title,
      description: `${job.description.en} Remote-friendly, screen-reader-tested application.`,
      validThrough: job.validThrough,
      employmentType: "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: job.employer },
      jobLocationType: job.remote ? "TELECOMMUTE" : "ON_SITE",
      jobLocation: { "@type": "Place", name: job.location },
    });
    this.appendChild(script);
  }

  private audio(): { url: string; transcript: string } {
    const lang = this.activeLang();
    const block = this.data?.audioSummary[lang] ?? this.data?.audioSummary.en;
    const root = this.apiRoot();
    const url = block?.url?.startsWith("http") ? block.url : `${root}${block?.url ?? ""}`;
    return { url, transcript: block?.transcript ?? "" };
  }

  private toggleAudio(): void {
    const audioEl = this.audioRef.value;
    if (!audioEl) return;
    if (this.playing) {
      audioEl.pause();
      audioEl.currentTime = 0;
      this.playing = false;
      this.live = this.t("job.audioStopped");
      return;
    }
    void audioEl.play();
    this.playing = true;
    this.live = this.t("job.audioPlaying");
  }

  private onEnded = () => {
    this.playing = false;
    this.live = this.t("job.audioStopped");
  };

  private applyHref(): string {
    if (!this.data) return "#";
    const apply = this.data.applyUrl;
    if (apply.startsWith("http")) return apply;
    return `${this.apiRoot()}${apply.startsWith("/") ? "" : "/"}${apply}`;
  }

  private formatDate(iso?: string | null): string {
    if (!iso) return "—";
    const locale = this.activeLang() === "am" ? "am-ET-u-ca-ethiopic" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(iso));
  }

  protected render() {
    if (this.error) {
      return html`<div class="wrap">
        <p>${this.t("job.error")}</p>
        <button type="button" @click=${() => this.load()}>${this.t("job.retry")}</button>
      </div>`;
    }
    if (!this.data) {
      return html`<p>${this.t("job.loading")}</p>`;
    }
    const lang = this.activeLang();
    const desc = this.data.description[lang] ?? this.data.description.en;
    const reqs =
      this.data.description.requirements?.[lang] ?? this.data.description.requirements?.en ?? [];
    const audio = this.audio();
    const prefs = readJobsPrefs();
    return html`
      <div class="wrap">
        <article lang=${lang}>
          <h2>${this.data.title}</h2>
          <p>${desc}</p>
          <dl>
            <dt>${this.t("job.employer")}</dt>
            <dd>${this.data.employer}</dd>
            <dt>${this.t("job.location")}</dt>
            <dd>
              ${this.data.location}${this.data.remote ? ` (${this.t("job.remote")})` : nothing}
            </dd>
            ${
              this.data.payText
                ? html`<dt>${this.t("job.pay")}</dt>
                    <dd>${this.data.payText}</dd>`
                : nothing
            }
            <dt>${this.t("job.deadline")}</dt>
            <dd>${this.formatDate(this.data.validThrough)}</dd>
          </dl>
          ${
            reqs.length
              ? html`<h3>${this.t("job.requirements")}</h3>
                  <ul>
                    ${reqs.map((item) => html`<li>${item}</li>`)}
                  </ul>`
              : nothing
          }
          <div class="row">
            <button
              type="button"
              @click=${() => this.toggleAudio()}
              aria-pressed=${this.playing ? "true" : "false"}
            >
              ${this.playing ? this.t("job.stopAudio") : this.t("job.playAudio")}
            </button>
            <a class="action" href=${this.applyHref()}>${this.t("job.apply")}</a>
          </div>
          <audio
            ${ref(this.audioRef)}
            src=${audio.url}
            preload="none"
            @ended=${this.onEnded}
          ></audio>
          <details
            ?open=${prefs.transcriptOpen !== false}
            @toggle=${(ev: Event) =>
              writeJobsPrefs({ transcriptOpen: (ev.target as HTMLDetailsElement).open })}
          >
            <summary>${this.t("job.transcript")}</summary>
            <p class="transcript">${audio.transcript}</p>
          </details>
        </article>
        <div role="status" aria-live="polite">${this.live}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "savanna-job-card": SavannaJobCard;
  }
}
