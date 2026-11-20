import{a as p,b as s,e as h,f as u,g as n,h as c}from"./chunk-4E6CAAHO.js";import{a}from"./chunk-INEEODZZ.js";var m={"cred.loading":"\u12E8\u121D\u1235\u12AD\u122D \u12C8\u1228\u1240\u1271 \u12A5\u12E8\u1270\u132B\u1290 \u1290\u12CD","cred.error":"\u12ED\u1205\u1295 \u12E8\u121D\u1235\u12AD\u122D \u12C8\u1228\u1240\u1275 \u1218\u132B\u1295 \u12A0\u120D\u1270\u127B\u1208\u121D\u1362","cred.retry":"\u12A5\u1295\u12F0\u1308\u1293 \u121E\u12AD\u122D","cred.heading":"\u12E8\u121D\u1235\u12AD\u122D \u12C8\u1228\u1240\u1275","cred.recipient":"\u1270\u1240\u1263\u12ED","cred.privateRecipient":"\u1235\u1219 \u1260\u130D\u120D \u1270\u1320\u1265\u124B\u120D","cred.issuer":"\u1230\u132A","cred.status":"\u1201\u1294\u1273","cred.valid":"\u1275\u12AD\u12AD\u120D","cred.revoked":"\u1270\u1230\u122D\u12DF\u120D","cred.expired":"\u130A\u12DC\u12CD \u12A0\u120D\u134F\u120D","cred.issued":"\u12E8\u1270\u1230\u1320\u1260\u1275 \u1240\u1295","cred.copy":"\u12E8\u121B\u1228\u130B\u1308\u132B \u12A0\u1308\u1293\u129D \u1245\u12F3","cred.copied":"\u12A0\u1308\u1293\u1299 \u1270\u1240\u12F5\u1277\u120D","cred.linkedin":"\u12C8\u12F0 \u120A\u1295\u12AD\u12F5\u12A2\u1295 \u1328\u121D\u122D","cred.pdf":"\u121D\u1235\u12AD\u122D \u12C8\u1228\u1240\u1271\u1295 \u12A0\u12CD\u122D\u12F5","cred.verify":"\u12E8\u1215\u12DD\u1265 \u121B\u1228\u130B\u1308\u132B \u1308\u133D \u12AD\u1348\u1275"};var v={"cred.loading":"Loading credential","cred.error":"We could not load this certificate.","cred.retry":"Try again","cred.heading":"Certificate","cred.recipient":"Recipient","cred.privateRecipient":"Name withheld for privacy","cred.issuer":"Issuer","cred.status":"Status","cred.valid":"Valid","cred.revoked":"Revoked","cred.expired":"Expired","cred.issued":"Issued","cred.copy":"Copy verification link","cred.copied":"Link copied","cred.linkedin":"Add to LinkedIn","cred.pdf":"Download PDF certificate","cred.verify":"Open public verify page"};function g(o,d){return(d||o.lang||document.documentElement.lang||"en").slice(0,2)==="am"?"am":"en"}var t=class extends h{constructor(){super(...arguments);this.api="";this.apiKey="";this.lang="";this.credentialAttribute="";this.credential="";this.data=null;this.error=!1;this.live="";this.hasLoaded=!1;this.onLang=e=>{let i=e.detail?.lang;i&&(this.lang=i)}}connectedCallback(){super.connectedCallback(),window.addEventListener("savanna:lang-change",this.onLang),this.hasLoaded&&this.load()}disconnectedCallback(){window.removeEventListener("savanna:lang-change",this.onLang),this.request?.abort(),super.disconnectedCallback()}updated(e){(!this.hasLoaded||e.has("credentialAttribute")||e.has("credential")||e.has("api")||e.has("apiKey"))&&(this.hasLoaded=!0,this.load())}t(e){return(this.activeLang()==="am"?m:v)[e]}activeLang(){return g(this,this.lang)}achievementName(){return this.data?.i18n?.achievement?.[this.activeLang()]??this.data?.credentialSubject?.achievement?.name??this.data?.name??""}recipientName(){return this.data?.i18n?.recipientName?.[this.activeLang()]??this.data?.credentialSubject?.name??this.t("cred.privateRecipient")}issuerName(){return this.data?.i18n?.issuerName?.[this.activeLang()]??this.data?.issuer?.name??""}apiRoot(){return(this.api||"").replace(/\/$/,"")}credentialId(){return this.credentialAttribute||this.credential||this.id}verifyUrl(){return`${this.apiRoot()}/verify/${encodeURIComponent(this.credentialId())}`}async load(){this.request?.abort();let e=new AbortController;this.request=e,this.error=!1,this.data=null;let i=this.credentialId();if(i)try{let r=await fetch(`${this.apiRoot()}/v1/credentials/${encodeURIComponent(i)}`,{headers:{"X-Savanna-Key":this.apiKey,Accept:"application/ld+json"},signal:e.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);this.data=await r.json(),this.dispatchEvent(new CustomEvent("savanna:ready",{bubbles:!0,composed:!0,detail:{credential:i}}))}catch(r){if(e.signal.aborted)return;this.error=!0,this.dispatchEvent(new CustomEvent("savanna:error",{bubbles:!0,composed:!0,detail:{credential:i,message:r instanceof Error?r.message:"Unable to load credential"}}))}}statusKey(){let e=this.data?.credentialStatus?.status??"valid";return e==="revoked"?"cred.revoked":e==="expired"?"cred.expired":"cred.valid"}async copy(){try{await navigator.clipboard.writeText(this.verifyUrl()),this.live=this.t("cred.copied")}catch{this.live=this.verifyUrl()}}linkedInHref(){let e=this.achievementName()||"Savanna credential",i=this.data?.validFrom?new Date(this.data.validFrom).getFullYear():new Date().getFullYear(),r=this.data?.validFrom?new Date(this.data.validFrom).getMonth()+1:1;return`https://www.linkedin.com/profile/add?${new URLSearchParams({startTask:"CERTIFICATION_NAME",name:e,organizationName:this.activeLang()==="am"?"\u12E8\u1233\u126B\u1293 \u1270\u12F0\u122B\u123D\u1290\u1275 \u12AA\u1275":"Savanna Access Kit",issueYear:String(i),issueMonth:String(r),certUrl:this.verifyUrl()}).toString()}`}render(){if(this.error)return s`<p>${this.t("cred.error")}</p>
        <button type="button" @click=${()=>this.load()}>${this.t("cred.retry")}</button>`;if(!this.data)return s`<p>${this.t("cred.loading")}</p>`;let e=this.activeLang(),i=this.achievementName()||"Credential",r=this.recipientName(),l=this.issuerName(),f=this.data.validFrom?new Intl.DateTimeFormat(e==="am"?"am-ET-u-ca-ethiopic":"en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(this.data.validFrom)):"";return s`
      <article lang=${e}>
        <h2>${this.t("cred.heading")}${e==="am"?"\u1366":":"} ${i}</h2>
        <p>${this.t("cred.recipient")}: ${r}</p>
        <p>${this.t("cred.issuer")}: ${l}</p>
        <p>${this.t("cred.status")}: ${this.t(this.statusKey())}</p>
        <p>${this.t("cred.issued")}: ${f}</p>
        <div class="row">
          <button type="button" @click=${()=>this.copy()}>${this.t("cred.copy")}</button>
          <a class="action" href=${this.linkedInHref()} rel="noopener noreferrer" target="_blank"
            >${this.t("cred.linkedin")}</a
          >
          <a class="action" href=${this.verifyUrl()}>${this.t("cred.verify")}</a>
          <a
            class="action"
            href=${`${this.apiRoot()}/verify/${encodeURIComponent(this.credentialId())}/pdf?lang=${e}`}
            >${this.t("cred.pdf")}</a
          >
        </div>
        <p role="status" aria-live="polite">${this.live}</p>
      </article>
    `}};t.styles=p`
    :host {
      display: block;
      font-family: var(--savanna-font, "Noto Sans Ethiopic", Nyala, "Segoe UI", system-ui, sans-serif);
      --_accent: var(--savanna-accent, #0b5cab);
      --_radius: var(--savanna-radius, 0.5rem);
      --_focus: var(--savanna-focus, #0b5cab);
      color: #111;
      max-width: 100%;
    }
    article {
      padding: 1rem;
      border: 2px solid #222;
      border-radius: var(--_radius);
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
      overflow-wrap: anywhere;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
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
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--_focus);
      outline-offset: 3px;
    }
    [role="status"] {
      min-height: 1.5rem;
    }
    @media (forced-colors: active) {
      article {
        border: 2px solid ButtonText;
      }
    }
  `,a([n({type:String})],t.prototype,"api",2),a([n({attribute:"api-key"})],t.prototype,"apiKey",2),a([n({type:String})],t.prototype,"lang",2),a([n({attribute:"id"})],t.prototype,"credentialAttribute",2),a([n({attribute:"credential"})],t.prototype,"credential",2),a([c()],t.prototype,"data",2),a([c()],t.prototype,"error",2),a([c()],t.prototype,"live",2),t=a([u("savanna-credential")],t);export{t as SavannaCredential};
//# sourceMappingURL=credential-SNGZC5XM.js.map
