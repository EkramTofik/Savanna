import{a as L,b as l,c as d,d as x,e as E,f as w,g as p,h as c}from"./chunk-2MOXT47L.js";import{a}from"./chunk-INEEODZZ.js";var{I:W}=x;var P=i=>i.strings===void 0;var R={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},f=i=>(...e)=>({_$litDirective$:i,values:e}),u=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,s){this._$Ct=e,this._$AM=t,this._$Ci=s}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var h=(i,e)=>{let t=i._$AN;if(t===void 0)return!1;for(let s of t)s._$AO?.(e,!1),h(s,e);return!0},m=i=>{let e,t;do{if((e=i._$AM)===void 0)break;t=e._$AN,t.delete(i),i=e}while(t?.size===0)},M=i=>{for(let e;e=i._$AM;i=e){let t=e._$AN;if(t===void 0)e._$AN=t=new Set;else if(t.has(i))break;t.add(i),q(e)}};function H(i){this._$AN!==void 0?(m(this),this._$AM=i,M(this)):this._$AM=i}function G(i,e=!1,t=0){let s=this._$AH,o=this._$AN;if(o!==void 0&&o.size!==0)if(e)if(Array.isArray(s))for(let n=t;n<s.length;n++)h(s[n],!1),m(s[n]);else s!=null&&(h(s,!1),m(s));else h(this,i)}var q=i=>{i.type==R.CHILD&&(i._$AP??=G,i._$AQ??=H)},g=class extends u{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,s){super._$AT(e,t,s),M(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(h(this,e),m(this))}setValue(e){if(P(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}};var C=()=>new v,v=class{},b=new WeakMap,I=f(class extends g{render(i){return d}update(i,[e]){let t=e!==this.G;return t&&this.rt(void 0),(t||this.lt!==this.ct)&&(this.G=e,this.ht=i.options?.host,this.rt(this.ct=i.element)),d}rt(i){if(this.G!==void 0)if(this.isConnected||(i=void 0),typeof this.G=="function"){let e=this.ht??globalThis,t=b.get(e);t===void 0&&(t=new WeakMap,b.set(e,t)),t.get(this.G)!==void 0&&this.G.call(this.ht,void 0),t.set(this.G,i),i!==void 0&&this.G.call(this.ht,i)}else this.G.value=i}get lt(){return typeof this.G=="function"?b.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});var k={"job.loading":"\u1235\u122B\u12CD \u12A5\u12E8\u1270\u132B\u1290 \u1290\u12CD","job.error":"\u12ED\u1205\u1295 \u1235\u122B \u1218\u132B\u1295 \u12A0\u120D\u1270\u127B\u1208\u121D\u1362","job.retry":"\u12A5\u1295\u12F0\u1308\u1293 \u121E\u12AD\u122D","job.employer":"\u12A0\u1230\u122A","job.location":"\u1266\u1273","job.employment":"\u12E8\u1225\u122B \u12D3\u12ED\u1290\u1275","job.pay":"\u12AD\u134D\u12EB","job.deadline":"\u12E8\u1218\u1328\u1228\u123B \u1240\u1295","job.remote":"\u12A8\u122D\u1240\u1275 \u1270\u1235\u121B\u121A","job.requirements":"\u12CB\u1293 \u1218\u1235\u1348\u122D\u1276\u127D","job.apply":"\u1208\u12DA\u1205 \u1235\u122B \u12EB\u1218\u120D\u12AD\u1271","job.playAudio":"\u12E8\u12F5\u121D\u133D \u121B\u1320\u1243\u1208\u12EB \u12A0\u132B\u12CD\u1275","job.stopAudio":"\u12E8\u12F5\u121D\u133D \u121B\u1320\u1243\u1208\u12EB \u12A0\u1241\u121D","job.transcript":"\u12E8\u12F5\u121D\u133D \u121B\u1320\u1243\u1208\u12EB \u133D\u1211\u134D","job.audioPlaying":"\u12E8\u12F5\u121D\u133D \u121B\u1320\u1243\u1208\u12EB \u12A5\u12E8\u1270\u132B\u12C8\u1270 \u1290\u12CD","job.audioStopped":"\u12E8\u12F5\u121D\u133D \u121B\u1320\u1243\u1208\u12EB \u1246\u121F\u120D"};var N={"job.loading":"Loading job","job.error":"We could not load this job.","job.retry":"Try again","job.employer":"Employer","job.location":"Location","job.employment":"Employment type","job.pay":"Pay","job.deadline":"Apply by","job.remote":"Remote-friendly","job.requirements":"Key requirements","job.apply":"Apply for this job","job.playAudio":"Play audio summary","job.stopAudio":"Stop audio summary","job.transcript":"Audio summary transcript","job.audioPlaying":"Playing audio summary","job.audioStopped":"Audio summary stopped"};var $="savanna.prefs.v1";function S(){try{let i=localStorage.getItem($);return i?JSON.parse(i).jobs??{}:{}}catch{return{}}}function j(i){try{let e=localStorage.getItem($),t=e?JSON.parse(e):{},s={...t.jobs??{},...i};localStorage.setItem($,JSON.stringify({...t,jobs:s}))}catch{}}function z(i,e){return(e||i.lang||document.documentElement.lang||"am").slice(0,2)==="am"?"am":"en"}var r=class extends E{constructor(){super(...arguments);this.job="";this.api="";this.apiKey="";this.lang="";this.data=null;this.error=!1;this.playing=!1;this.live="";this.audioRef=C();this.hasLoaded=!1;this.onLang=t=>{let s=t.detail?.lang;s&&(this.lang=s)};this.onEnded=()=>{this.playing=!1,this.live=this.t("job.audioStopped")}}connectedCallback(){super.connectedCallback(),window.addEventListener("savanna:lang-change",this.onLang),this.hasLoaded&&this.load()}disconnectedCallback(){window.removeEventListener("savanna:lang-change",this.onLang),this.request?.abort(),this.audioRef.value?.pause(),super.disconnectedCallback()}updated(t){t.has("lang")&&this.injectJsonLd(),(!this.hasLoaded||t.has("job")||t.has("api")||t.has("apiKey"))&&(this.hasLoaded=!0,this.load())}t(t){return(this.activeLang()==="am"?k:N)[t]}activeLang(){return z(this,this.lang)}localized(t){return this.data?.i18n?.[t]?.[this.activeLang()]??null}employmentType(){let t=this.data?.employmentType??"FULL_TIME";return{FULL_TIME:{en:"Full-time",am:"\u1219\u1209 \u130A\u12DC"},PART_TIME:{en:"Part-time",am:"\u12E8\u1275\u122D\u134D \u130A\u12DC"},CONTRACT:{en:"Contract",am:"\u12CD\u120D"},TEMPORARY:{en:"Temporary",am:"\u130A\u12DC\u12EB\u12CA"},INTERN:{en:"Internship",am:"\u120D\u121D\u121D\u12F5"}}[t]?.[this.activeLang()]??t.replaceAll("_"," ")}apiRoot(){return(this.api||"").replace(/\/$/,"")}async load(){this.request?.abort();let t=new AbortController;if(this.request=t,this.error=!1,this.data=null,!!this.job)try{let s=`${this.apiRoot()}/v1/jobs/${encodeURIComponent(this.job)}`,o=await fetch(s,{headers:{"X-Savanna-Key":this.apiKey},signal:t.signal});if(!o.ok)throw new Error(`HTTP ${o.status}`);this.data=await o.json(),j({lastJobId:this.job}),this.injectJsonLd(),this.dispatchEvent(new CustomEvent("savanna:ready",{bubbles:!0,composed:!0,detail:{job:this.job}}))}catch(s){if(t.signal.aborted)return;this.error=!0,this.dispatchEvent(new CustomEvent("savanna:error",{bubbles:!0,composed:!0,detail:{job:this.job,message:s instanceof Error?s.message:"Unable to load job"}}))}}injectJsonLd(){if(this.querySelector('script[data-savanna="jobposting"]')?.remove(),!this.data)return;let s=document.createElement("script");s.type="application/ld+json",s.dataset.savanna="jobposting";let o=this.data;s.textContent=JSON.stringify({"@context":"https://schema.org/","@type":"JobPosting",identifier:o.id,title:this.localized("title")??o.title,description:o.description[this.activeLang()],validThrough:o.validThrough,employmentType:"FULL_TIME",hiringOrganization:{"@type":"Organization",name:this.localized("employer")??o.employer},jobLocationType:o.remote?"TELECOMMUTE":"ON_SITE",jobLocation:{"@type":"Place",name:this.localized("location")??o.location}}),this.appendChild(s)}audio(){let t=this.activeLang(),s=this.data?.audioSummary[t],o=this.apiRoot();return{url:s?.url?.startsWith("http")?s.url:`${o}${s?.url??""}`,transcript:s?.transcript??""}}toggleAudio(){let t=this.audioRef.value;if(t){if(this.playing){t.pause(),t.currentTime=0,this.playing=!1,this.live=this.t("job.audioStopped");return}t.play(),this.playing=!0,this.live=this.t("job.audioPlaying")}}applyHref(){if(!this.data)return"#";let t=this.data.applyUrl;if(t.startsWith("http"))return t;let s=`${this.apiRoot()}${t.startsWith("/")?"":"/"}${t}`;return t.startsWith("/apply/")?`${s}${t.includes("?")?"&":"?"}lang=${this.activeLang()}`:s}formatDate(t){if(!t)return"\u2014";let s=this.activeLang()==="am"?"am-ET-u-ca-ethiopic":"en-GB";return new Intl.DateTimeFormat(s,{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(t))}render(){if(this.error)return l`<div class="wrap">
        <p>${this.t("job.error")}</p>
        <button type="button" @click=${()=>this.load()}>${this.t("job.retry")}</button>
      </div>`;if(!this.data)return l`<p>${this.t("job.loading")}</p>`;let t=this.activeLang(),s=this.data.description[t],o=this.localized("title")??this.data.title,n=this.localized("employer")??this.data.employer,O=this.localized("location")??this.data.location,A=this.localized("payText")??this.data.payText,D=this.employmentType(),_=this.data.description.requirements?.[t]??[],T=this.audio(),U=S();return l`
      <div class="wrap">
        <article lang=${t}>
          <h2>${o}</h2>
          <p>${s}</p>
          <dl>
            <dt>${this.t("job.employer")}</dt>
            <dd>${n}</dd>
            <dt>${this.t("job.location")}</dt>
            <dd>
              ${O}${this.data.remote?` (${this.t("job.remote")})`:d}
            </dd>
            <dt>${this.t("job.employment")}</dt>
            <dd>${D}</dd>
            ${A?l`<dt>${this.t("job.pay")}</dt>
                    <dd>${A}</dd>`:d}
            <dt>${this.t("job.deadline")}</dt>
            <dd>${this.formatDate(this.data.validThrough)}</dd>
          </dl>
          ${_.length?l`<h3>${this.t("job.requirements")}</h3>
                  <ul>
                    ${_.map(y=>l`<li>${y}</li>`)}
                  </ul>`:d}
          <div class="row">
            <button
              type="button"
              @click=${()=>this.toggleAudio()}
              aria-pressed=${this.playing?"true":"false"}
            >
              ${this.playing?this.t("job.stopAudio"):this.t("job.playAudio")}
            </button>
            <a class="action" href=${this.applyHref()}>${this.t("job.apply")}</a>
          </div>
          <audio
            ${I(this.audioRef)}
            src=${T.url}
            preload="none"
            @ended=${this.onEnded}
          ></audio>
          <details
            ?open=${U.transcriptOpen!==!1}
            @toggle=${y=>j({transcriptOpen:y.target.open})}
          >
            <summary>${this.t("job.transcript")}</summary>
            <p class="transcript">${T.transcript}</p>
          </details>
        </article>
        <div role="status" aria-live="polite">${this.live}</div>
      </div>
    `}};r.styles=L`
    :host {
      display: block;
      color: #111;
      font-family: var(--savanna-font, "Noto Sans Ethiopic", Nyala, "Segoe UI", system-ui, sans-serif);
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
  `,a([p({type:String})],r.prototype,"job",2),a([p({type:String})],r.prototype,"api",2),a([p({attribute:"api-key"})],r.prototype,"apiKey",2),a([p({type:String})],r.prototype,"lang",2),a([c()],r.prototype,"data",2),a([c()],r.prototype,"error",2),a([c()],r.prototype,"playing",2),a([c()],r.prototype,"live",2),r=a([w("savanna-job-card")],r);export{r as SavannaJobCard};
/*! Bundled license information:

lit-html/directive-helpers.js:
lit-html/directives/ref.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
lit-html/async-directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=job-card-ZJIM3THD.js.map
