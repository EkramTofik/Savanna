const en = {
  "job.loading": "Loading job",
  "job.error": "We could not load this job.",
  "job.retry": "Try again",
  "job.employer": "Employer",
  "job.location": "Location",
  "job.pay": "Pay",
  "job.deadline": "Apply by",
  "job.remote": "Remote-friendly",
  "job.requirements": "Key requirements",
  "job.apply": "Apply for this job",
  "job.playAudio": "Play audio summary",
  "job.stopAudio": "Stop audio summary",
  "job.transcript": "Audio summary transcript",
  "job.audioPlaying": "Playing audio summary",
  "job.audioStopped": "Audio summary stopped",
};
const am = {
  "job.loading": "ስራው እየተጫነ ነው",
  "job.error": "ይህን ስራ መጫን አልተቻለም።",
  "job.retry": "እንደገና ሞክር",
  "job.employer": "አሰሪ",
  "job.location": "ቦታ",
  "job.pay": "ክፍያ",
  "job.deadline": "የመጨረሻ ቀን",
  "job.remote": "ከርቀት ተስማሚ",
  "job.requirements": "ዋና መስፈርቶች",
  "job.apply": "ለዚህ ስራ ያመልክቱ",
  "job.playAudio": "የድምጽ ማጠቃለያ አጫውት",
  "job.stopAudio": "የድምጽ ማጠቃለያ አቁም",
  "job.transcript": "የድምጽ ማጠቃለያ ጽሑፍ",
  "job.audioPlaying": "የድምጽ ማጠቃለያ እየተጫወተ ነው",
  "job.audioStopped": "የድምጽ ማጠቃለያ ቆሟል",
};

const css = `
:host { display:block; color:#111; font-family:var(--savanna-font, system-ui, sans-serif);
  --_accent:var(--savanna-accent,#0b5cab); --_radius:var(--savanna-radius,.5rem);
  --_focus:var(--savanna-focus,#0b5cab); max-width:100%; }
article { display:flex; flex-direction:column; gap:.75rem; padding:1rem;
  border:2px solid #222; border-radius:var(--_radius); background:#fff; }
h2 { margin:0; font-size:1.25rem; line-height:1.3; overflow-wrap:anywhere; }
dl { display:grid; grid-template-columns:1fr; gap:.35rem; margin:0; }
dt { font-weight:700; } dd { margin:0 0 .5rem; overflow-wrap:anywhere; }
ul { margin:0; padding-inline-start:1.2rem; }
button, a.action { display:inline-flex; align-items:center; justify-content:center;
  min-height:44px; min-width:44px; padding:.5rem 1rem; margin:0 .5rem .5rem 0;
  font:inherit; color:#fff; background:var(--_accent); border:0; border-radius:var(--_radius);
  text-decoration:none; cursor:pointer; }
button[aria-pressed="true"] { background:#111; }
button:focus-visible, a:focus-visible { outline:3px solid var(--_focus); outline-offset:3px; }
summary { min-height:44px; display:flex; align-items:center; cursor:pointer; }
.transcript { margin:0; padding:.75rem; background:#f4f4f4; border-left:4px solid var(--_accent);
  overflow-wrap:anywhere; }
.live { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
.wrap { position:relative; }
@media (forced-colors: active) { article { border:2px solid ButtonText; } }
`;

function langOf(el) {
  const v = (el.getAttribute("lang") || document.documentElement.lang || "en").slice(0, 2);
  return v === "am" ? "am" : "en";
}

function t(el, key) {
  return (langOf(el) === "am" ? am : en)[key] ?? key;
}

function prefsRead() {
  try {
    return JSON.parse(localStorage.getItem("savanna.prefs.v1") || "{}").jobs ?? {};
  } catch {
    return {};
  }
}

function prefsWrite(patch) {
  try {
    const all = JSON.parse(localStorage.getItem("savanna.prefs.v1") || "{}");
    all.jobs = { ...(all.jobs ?? {}), ...patch };
    localStorage.setItem("savanna.prefs.v1", JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

class SavannaJobCard extends HTMLElement {
  static get observedAttributes() {
    return ["job", "api", "api-key", "lang"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._playing = false;
  }

  connectedCallback() {
    window.addEventListener("savanna:lang-change", this._onLang);
    this._load();
  }

  disconnectedCallback() {
    window.removeEventListener("savanna:lang-change", this._onLang);
  }

  attributeChangedCallback() {
    if (this.isConnected) this._load();
  }

  _onLang = (ev) => {
    if (ev.detail?.lang) this.setAttribute("lang", ev.detail.lang);
  };

  _root() {
    return (this.getAttribute("api") || "").replace(/\/$/, "");
  }

  async _load() {
    const job = this.getAttribute("job");
    if (!job) return;
    this.shadowRoot.innerHTML = `<style>${css}</style><p>${t(this, "job.loading")}</p>`;
    try {
      const res = await fetch(`${this._root()}/v1/jobs/${encodeURIComponent(job)}`, {
        headers: { "X-Savanna-Key": this.getAttribute("api-key") || "" },
      });
      if (!res.ok) throw new Error("bad");
      this._data = await res.json();
      prefsWrite({ lastJobId: job });
      this._injectLd();
      this._render();
      this.dispatchEvent(new CustomEvent("savanna:ready", { bubbles: true, composed: true, detail: { job } }));
    } catch {
      this.shadowRoot.innerHTML = `<style>${css}</style><p>${t(this, "job.error")}</p>
        <button type="button" class="retry">${t(this, "job.retry")}</button>`;
      this.shadowRoot.querySelector(".retry")?.addEventListener("click", () => this._load());
      this.dispatchEvent(new CustomEvent("savanna:error", { bubbles: true, composed: true, detail: { job } }));
    }
  }

  _injectLd() {
    this.querySelector('script[data-savanna="jobposting"]')?.remove();
    const job = this._data;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.savanna = "jobposting";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      identifier: job.id,
      title: job.title,
      description: `${job.description.en} Remote-friendly, screen-reader-tested application.`,
      validThrough: job.validThrough,
      employmentType: job.employmentType || "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: job.employer },
      jobLocationType: job.remote ? "TELECOMMUTE" : "ON_SITE",
      jobLocation: { "@type": "Place", name: job.location },
    });
    this.appendChild(script);
  }

  _render() {
    const lang = langOf(this);
    const job = this._data;
    const desc = job.description[lang] || job.description.en;
    const reqs = job.description.requirements?.[lang] || job.description.requirements?.en || [];
    const audio = job.audioSummary[lang] || job.audioSummary.en;
    const audioUrl = audio.url.startsWith("http") ? audio.url : `${this._root()}${audio.url}`;
    const apply = job.applyUrl.startsWith("http") ? job.applyUrl : `${this._root()}${job.applyUrl}`;
    const locale = lang === "am" ? "am-ET" : "en-GB";
    const deadline = job.validThrough
      ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(job.validThrough))
      : "—";
    const reqHtml = reqs.length
      ? `<h3>${t(this, "job.requirements")}</h3><ul>${reqs.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
      : "";
    const pay = job.payText ? `<dt>${t(this, "job.pay")}</dt><dd>${esc(job.payText)}</dd>` : "";
    this.shadowRoot.innerHTML = `<style>${css}</style>
      <div class="wrap"><article lang="${lang}">
        <h2>${esc(job.title)}</h2>
        <p>${esc(desc)}</p>
        <dl>
          <dt>${t(this, "job.employer")}</dt><dd>${esc(job.employer)}</dd>
          <dt>${t(this, "job.location")}</dt><dd>${esc(job.location)}${job.remote ? ` (${t(this, "job.remote")})` : ""}</dd>
          ${pay}
          <dt>${t(this, "job.deadline")}</dt><dd>${esc(deadline)}</dd>
        </dl>
        ${reqHtml}
        <div>
          <button type="button" class="audio" aria-pressed="false">${t(this, "job.playAudio")}</button>
          <a class="action" href="${esc(apply)}">${t(this, "job.apply")}</a>
        </div>
        <audio preload="none" src="${esc(audioUrl)}"></audio>
        <details ${prefsRead().transcriptOpen === false ? "" : "open"}>
          <summary>${t(this, "job.transcript")}</summary>
          <p class="transcript">${esc(audio.transcript)}</p>
        </details>
      </article>
      <div class="live" role="status" aria-live="polite"></div></div>`;
    const audioEl = this.shadowRoot.querySelector("audio");
    const btn = this.shadowRoot.querySelector(".audio");
    const live = this.shadowRoot.querySelector(".live");
    btn.addEventListener("click", () => {
      if (this._playing) {
        audioEl.pause();
        audioEl.currentTime = 0;
        this._playing = false;
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = t(this, "job.playAudio");
        live.textContent = t(this, "job.audioStopped");
      } else {
        audioEl.play();
        this._playing = true;
        btn.setAttribute("aria-pressed", "true");
        btn.textContent = t(this, "job.stopAudio");
        live.textContent = t(this, "job.audioPlaying");
      }
    });
    audioEl.addEventListener("ended", () => {
      this._playing = false;
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = t(this, "job.playAudio");
      live.textContent = t(this, "job.audioStopped");
    });
    this.shadowRoot.querySelector("details").addEventListener("toggle", (ev) => {
      prefsWrite({ transcriptOpen: ev.currentTarget.open });
    });
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

customElements.define("savanna-job-card", SavannaJobCard);
