const en = {
  "cred.loading": "Loading credential",
  "cred.error": "We could not load this certificate.",
  "cred.retry": "Try again",
  "cred.heading": "Certificate",
  "cred.status": "Status",
  "cred.valid": "Valid",
  "cred.revoked": "Revoked",
  "cred.expired": "Expired",
  "cred.issued": "Issued",
  "cred.copy": "Copy verification link",
  "cred.copied": "Link copied",
  "cred.linkedin": "Add to LinkedIn",
  "cred.pdf": "Download PDF certificate",
  "cred.verify": "Open public verify page",
};
const am = {
  "cred.loading": "የምስክር ወረቀቱ እየተጫነ ነው",
  "cred.error": "ይህን የምስክር ወረቀት መጫን አልተቻለም።",
  "cred.retry": "እንደገና ሞክር",
  "cred.heading": "የምስክር ወረቀት",
  "cred.status": "ሁኔታ",
  "cred.valid": "ትክክል",
  "cred.revoked": "ተሰርዟል",
  "cred.expired": "ጊዜው አልፏል",
  "cred.issued": "የተሰጠበት ቀን",
  "cred.copy": "የማረጋገጫ አገናኝ ቅዳ",
  "cred.copied": "አገናኙ ተቀድቷል",
  "cred.linkedin": "ወደ ሊንክድኢን ጨምር",
  "cred.pdf": "ምስክር ወረቀቱን አውርድ",
  "cred.verify": "የሕዝብ ማረጋገጫ ገጽ ክፈት",
};

const css = `
:host { display:block; font-family:var(--savanna-font, "Noto Sans Ethiopic", Nyala, system-ui, sans-serif);
  --_accent:var(--savanna-accent,#0b5cab); --_radius:var(--savanna-radius,.5rem);
  --_focus:var(--savanna-focus,#0b5cab); color:#111; max-width:100%; }
article { padding:1rem; border:2px solid #222; border-radius:var(--_radius); background:#fff;
  display:flex; flex-direction:column; gap:.5rem; }
h2 { margin:0; font-size:1.25rem; overflow-wrap:anywhere; }
.row { display:flex; flex-wrap:wrap; }
button, a.action { display:inline-flex; align-items:center; justify-content:center;
  min-height:44px; min-width:44px; padding:.5rem 1rem; margin:0 .5rem .5rem 0;
  font:inherit; color:#fff; background:var(--_accent); border:0; border-radius:var(--_radius);
  text-decoration:none; cursor:pointer; }
button:focus-visible, a:focus-visible { outline:3px solid var(--_focus); outline-offset:3px; }
[role="status"] { min-height:1.5rem; }
@media (forced-colors: active) { article { border:2px solid ButtonText; } }
`;

function langOf(el) {
  const v = (el.getAttribute("lang") || document.documentElement.lang || "am").slice(0, 2);
  return v === "am" ? "am" : "en";
}

function t(el, key) {
  return (langOf(el) === "am" ? am : en)[key] ?? key;
}

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

class SavannaCredential extends HTMLElement {
  static get observedAttributes() {
    return ["credential", "api", "api-key", "lang"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    window.addEventListener("savanna:lang-change", this._onLang);
    this._load();
  }

  disconnectedCallback() {
    window.removeEventListener("savanna:lang-change", this._onLang);
  }

  attributeChangedCallback(name) {
    if (this.isConnected && name !== "id") this._load();
  }

  _onLang = (ev) => {
    if (ev.detail?.lang) this.setAttribute("lang", ev.detail.lang);
  };

  _cid() {
    return this.getAttribute("credential") || this.getAttribute("id") || "";
  }

  _root() {
    return (this.getAttribute("api") || "").replace(/\/$/, "");
  }

  _verify() {
    return `${this._root()}/verify/${encodeURIComponent(this._cid())}`;
  }

  async _load() {
    const id = this._cid();
    if (!id) return;
    this.shadowRoot.innerHTML = `<style>${css}</style><p>${t(this, "cred.loading")}</p>`;
    try {
      const res = await fetch(`${this._root()}/v1/credentials/${encodeURIComponent(id)}`, {
        headers: {
          "X-Savanna-Key": this.getAttribute("api-key") || "",
          Accept: "application/ld+json",
        },
      });
      if (!res.ok) throw new Error("bad");
      this._data = await res.json();
      this._render();
    } catch {
      this.shadowRoot.innerHTML = `<style>${css}</style><p>${t(this, "cred.error")}</p>
        <button type="button" class="retry">${t(this, "cred.retry")}</button>`;
      this.shadowRoot.querySelector(".retry")?.addEventListener("click", () => this._load());
    }
  }

  _render() {
    const lang = langOf(this);
    const data = this._data;
    const achievement = data.credentialSubject?.achievement?.name || data.name || "Credential";
    const status = data.credentialStatus?.status || "valid";
    const statusKey =
      status === "revoked" ? "cred.revoked" : status === "expired" ? "cred.expired" : "cred.valid";
    const issued = data.validFrom
      ? new Intl.DateTimeFormat(lang === "am" ? "am-ET-u-ca-ethiopic" : "en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(data.validFrom))
      : "";
    const year = data.validFrom ? new Date(data.validFrom).getFullYear() : new Date().getFullYear();
    const month = data.validFrom ? new Date(data.validFrom).getMonth() + 1 : 1;
    const linkedin = `https://www.linkedin.com/profile/add?${new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: achievement,
      organizationName: "የሳቫና ተደራሽነት ኪት",
      issueYear: String(year),
      issueMonth: String(month),
      certUrl: this._verify(),
    })}`;
    this.shadowRoot.innerHTML = `<style>${css}</style>
      <article lang="${lang}">
        <h2>${t(this, "cred.heading")}፦ ${esc(achievement)}</h2>
        <p>${t(this, "cred.status")}: ${t(this, statusKey)}</p>
        <p>${t(this, "cred.issued")}: ${esc(issued)}</p>
        <div class="row">
          <button type="button" class="copy">${t(this, "cred.copy")}</button>
          <a class="action" href="${esc(linkedin)}" rel="noopener noreferrer" target="_blank">${t(this, "cred.linkedin")}</a>
          <a class="action" href="${esc(this._verify())}">${t(this, "cred.verify")}</a>
          <a class="action" href="${esc(`${this._root()}/verify/${encodeURIComponent(this._cid())}/pdf`)}">${t(this, "cred.pdf")}</a>
        </div>
        <p class="live" role="status" aria-live="polite"></p>
      </article>`;
    this.shadowRoot.querySelector(".copy").addEventListener("click", async () => {
      const live = this.shadowRoot.querySelector(".live");
      try {
        await navigator.clipboard.writeText(this._verify());
        live.textContent = t(this, "cred.copied");
      } catch {
        live.textContent = this._verify();
      }
    });
  }
}

customElements.define("savanna-credential", SavannaCredential);
