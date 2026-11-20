import{a as C,b as g,e as I,f as A,g as v,h as f}from"./chunk-2MOXT47L.js";import{a as u}from"./chunk-INEEODZZ.js";function R(o,a){let e;try{let t=new URL(a).pathname;e=t.endsWith("/transcript")?"transcript.json":decodeURIComponent(t.split("/").pop()||"")}catch{return}return o.packMetadata?.files?.find(t=>t.path===e)}async function k(o,a){if(!a||!Number.isSafeInteger(a.sizeBytes)||!/^[a-f\d]{64}$/i.test(a.sha256))throw new Error("The offline pack does not provide a valid checksum for this file.");if(o.byteLength!==a.sizeBytes)throw new Error(`${a.path} size mismatch (expected ${a.sizeBytes} bytes, received ${o.byteLength}).`);if(!globalThis.crypto?.subtle)throw new Error("This browser cannot verify offline file checksums.");let e=await crypto.subtle.digest("SHA-256",o);if(Array.from(new Uint8Array(e),i=>i.toString(16).padStart(2,"0")).join("").toLowerCase()!==a.sha256.toLowerCase())throw new Error(`${a.path} failed its SHA-256 checksum check.`)}function $(o,a,e=a){let t=a.replace(/\/$/,"")+"/",i=[],n=new Set,s=(r,c)=>{if(!c)return;let l=c.startsWith("/media/")?`${e.replace(/\/$/,"")}/`:t,d=new URL(c,l).href;n.has(d)||(n.add(d),i.push({kind:r,url:d}))};s("video",o.media?.video),s("audio",o.media?.audio);for(let r of o.captions??[])(r.lang==="am"||r.lang==="en")&&s(`captions-${r.lang}`,r.url);if(s("sign-language-video",o.sign?.url),s("audio-description",o.audioDescription?.audioUrl),s("audio-description-cues",o.audioDescription?.vttUrl),o.transcript?.url){let r=new URL(o.transcript.url,t);r.searchParams.set("lang","en"),s("transcript",r.href)}return i}async function B(o="/media-sw.js"){if(!("serviceWorker"in navigator))return null;try{let a=await navigator.serviceWorker.register(o,{scope:"/",updateViaCache:"none"});return navigator.storage?.persist&&await navigator.storage.persist().catch(()=>!1),a}catch(a){return console.warn("Offline support unavailable",a),null}}var x="savanna.prefs.v1",U="savanna-pack-";function y(){try{let o=JSON.parse(localStorage.getItem(x)||"{}");return{savedLessons:[],incompleteLessons:[],...o.offline||{}}}catch{return{savedLessons:[],incompleteLessons:[]}}}function L(o){try{let a=JSON.parse(localStorage.getItem(x)||"{}");a.offline=o,localStorage.setItem(x,JSON.stringify(a))}catch{throw new Error("Browser settings storage is full or unavailable.")}}var h=class extends I{constructor(){super(...arguments);this.api="";this.apiKey="";this.lessonId="";this.manifest=null;this.status="Download this lesson to keep its available files on this device.";this.busy=!1;this.progress=0;this.saved=!1;this.incomplete=!1;this.error=!1;this.language="en"}connectedCallback(){super.connectedCallback(),this.saved=y().savedLessons.includes(this.lessonId),this.incomplete=y().incompleteLessons.includes(this.lessonId),this.language=this.currentLanguage(),B("/media-sw.js"),this.refresh()}updated(e){(e.has("api")||e.has("lessonId"))&&this.api&&this.lessonId&&this.refresh();let t=this.currentLanguage();t!==this.language&&(this.language=t)}currentLanguage(){return(this.closest("savanna-player")?.getAttribute("lang")||document.documentElement.lang||"en").toLowerCase().startsWith("am")?"am":"en"}text(e,t){return this.language==="am"?t:e}apiOrigin(){return this.api.replace(/\/$/,"")}packUrl(){return`${this.apiOrigin()}/v1/lessons/${encodeURIComponent(this.lessonId)}/pack`}lessonUrl(){return`${this.apiOrigin()}/v1/lessons/${encodeURIComponent(this.lessonId)}`}cacheName(){return`${U}${this.lessonId}`}headersFor(e){if(!this.apiKey)return{};try{if(new URL(e).origin===new URL(this.apiOrigin()).origin)return{"X-Savanna-Key":this.apiKey}}catch{}return{}}async refresh(){if(!(!this.api||!this.lessonId||this.busy))try{let e=async c=>{try{let l=await fetch(c,{headers:this.headersFor(c)});if(!l.ok)throw new Error(l.status===404?"No offline pack is published for this lesson.":`Pack information could not be loaded (${l.status}).`);return l}catch(l){if(typeof caches<"u"){let m=await(await caches.open(this.cacheName())).match(c);if(m)return m}throw l instanceof Error?l:new Error("Connect once to load this lesson pack.")}},t=await e(this.packUrl()),i=await e(this.lessonUrl()),n=await t.json(),s=await i.json(),r={...s,sizeBytes:Number(n.sizeBytes)||0,packMetadata:n};if(this.manifest=r,typeof caches<"u"){let c=await caches.open(this.cacheName());await c.put(this.packUrl(),new Response(JSON.stringify(n),{headers:{"Content-Type":"application/json"}})),await c.put(this.lessonUrl(),new Response(JSON.stringify(s),{headers:{"Content-Type":"application/json"}}))}this.saved=y().savedLessons.includes(this.lessonId),this.error=!1,this.status=`${this.text("Pack ready","\u1325\u1245\u1209 \u12DD\u130D\u1301 \u1290\u12CD")} \xB7 ${this.size(r.sizeBytes||0)}`}catch(e){this.error=!0,this.status=e instanceof Error?e.message:"Pack information could not be loaded."}}size(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(2)} MB`}async checkAvailableStorage(e,t,i){if(!navigator.storage?.estimate)return;let n=0;for(let r of t){let c=await e.match(r);c&&(n+=Number(c.headers.get("content-length"))||(await c.clone().arrayBuffer()).byteLength)}let s=await navigator.storage.estimate();if(typeof s.quota=="number"&&typeof s.usage=="number"){let r=Math.max(0,i-n);if(s.quota-s.usage<r*1.05)throw new DOMException("There may not be enough browser storage for this lesson. Remove an offline copy or free device space and retry.","QuotaExceededError")}}async saveAsset(e,t,i,n,s){let r=this.manifest?R(this.manifest,t):void 0,c=await e.match(t);if(c){let p=await c.clone().arrayBuffer();try{await k(p,r);let w=p.byteLength;return this.progress=n>0?Math.min(99,Math.round((s+w)/n*100)):this.progress,w}catch{await e.delete(t)}}this.status=`${this.text("Downloading","\u1260\u121B\u12CD\u1228\u12F5 \u120B\u12ED")}: ${i}`;let l;try{l=await this.fetchAsset(t)}catch(p){let w=p instanceof Error?p.message:String(p);throw new Error(`${i} ${w}`)}let d=l.body?.getReader();if(!d)throw new Error("This browser cannot stream lesson downloads.");let m=[],P=0;for(;;){let p=await d.read();if(p.done)break;p.value&&(m.push(p.value),P+=p.value.byteLength,this.progress=n>0?Math.min(99,Math.round((s+P)/n*100)):this.progress)}let b=new Blob(m,{type:l.headers.get("content-type")||"application/octet-stream"});await k(await b.arrayBuffer(),r);let E=new Headers(l.headers);return E.set("Content-Length",String(b.size)),await e.put(t,new Response(b,{status:200,headers:E})),b.size}async fetchAsset(e){let t=[e];try{let s=new URL(e,location.origin),r=new URL(this.apiOrigin(),location.origin);s.origin===location.origin&&s.pathname.startsWith("/media/")&&r.origin!==s.origin&&t.push(new URL(`${s.pathname}${s.search}`,r.origin).href)}catch{}let i;for(let s of t)try{let r=await fetch(s,{headers:this.headersFor(s),signal:this.controller?.signal});if(r.ok)return r;i=new Error(`${r.status}`)}catch(r){if(i=r instanceof Error?r:new Error(String(r)),i.name==="AbortError")throw i}let n=i?.message.match(/^\d+$/)?.[0];throw new Error(`${n?`download failed (${n})`:"download could not connect"}.`)}async save(){if(this.busy||!this.manifest||typeof caches>"u"){typeof caches>"u"&&(this.error=!0,this.status="Offline storage is unavailable in this browser. Open the site over HTTPS or localhost.");return}let e=$(this.manifest,this.apiOrigin(),location.origin);if(!e.length){this.error=!0,this.status="This lesson has no downloadable media assets.";return}this.busy=!0,this.error=!1,this.progress=0,this.controller=new AbortController;let t;try{t=await caches.open(this.cacheName());let i=e.map(d=>d.url);await this.checkAvailableStorage(t,i,this.manifest.sizeBytes||0);let n=new URL(`/savanna-offline/${encodeURIComponent(this.lessonId)}/manifest.json`,location.origin).href,s=new Response(JSON.stringify({...this.manifest,id:this.lessonId}),{headers:{"Content-Type":"application/json; charset=utf-8"}});await t.put(n,s),await t.put(this.lessonUrl(),new Response(JSON.stringify(this.manifest),{headers:{"Content-Type":"application/json"}}));let r=this.manifest.sizeBytes||0,c=0;for(let d of e){let m=await this.saveAsset(t,d.url,d.kind,r,c);c+=m}let l=y();l.savedLessons=[...new Set([...l.savedLessons,this.lessonId])],l.incompleteLessons=l.incompleteLessons.filter(d=>d!==this.lessonId),L(l),this.saved=!0,this.incomplete=!1,this.progress=100,this.error=!1,this.status=`${this.text("Saved offline","\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u1270\u1240\u121D\u1327\u120D")} \xB7 ${this.size(c)}. ${this.text("Refresh this lesson page once while online to activate offline playback.","\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u1208\u121B\u132B\u12C8\u1275 \u12A2\u1295\u1270\u122D\u1294\u1275 \u12A5\u12EB\u1208 \u12ED\u1205\u1295 \u1308\u133D \u12A0\u1295\u12F5 \u130A\u12DC \u12EB\u12F5\u1231\u1362")}`}catch(i){let n=y();n.incompleteLessons=[...new Set([...n.incompleteLessons,this.lessonId])];try{L(n)}catch{}this.incomplete=!0,this.saved=!1,this.error=!0;let s=i instanceof Error?i:new Error(String(i));s.name==="AbortError"?this.status="Download interrupted. Completed files are kept; retry to continue.":s.name==="QuotaExceededError"||/quota|storage/i.test(s.message)?this.status="Not enough browser storage. Remove an offline copy or free device space, then retry.":this.status=`${s.message} Completed files are kept so a retry can continue.`}finally{this.controller=void 0,this.busy=!1}}cancel(){this.controller?.abort()}async removeOfflineCopy(){if(this.busy)return;typeof caches<"u"&&await caches.delete(this.cacheName()).catch(()=>!1);let e=y();e.savedLessons=e.savedLessons.filter(t=>t!==this.lessonId),e.incompleteLessons=e.incompleteLessons.filter(t=>t!==this.lessonId);try{L(e),this.saved=!1,this.incomplete=!1,this.progress=0,this.error=!1,this.status=this.text("Offline copy removed from this device.","\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u12E8\u1270\u1240\u1218\u1320\u12CD \u1245\u1302 \u12A8\u12DA\u1205 \u1218\u1223\u122A\u12EB \u1270\u12C8\u130D\u12F7\u120D\u1362")}catch(t){this.error=!0,this.status=t instanceof Error?t.message:"The offline status could not be updated."}}renderAssets(){if(!this.manifest)return"";let e=$(this.manifest,this.apiOrigin(),location.origin).map(t=>t.kind);return g`<p class="summary" dir="auto">
      ${this.text("Includes","\u12E8\u1270\u12AB\u1270\u1271 \u134B\u12ED\u120E\u127D")}:
      ${e.join(", ")}${this.manifest.audioDescription?"":` \xB7 ${this.text("Audio description not supplied","\u12E8\u12F5\u121D\u133D \u121B\u1265\u122B\u122A\u12EB \u12A0\u120D\u1240\u1228\u1260\u121D")}`}${this.manifest.sign?"":` \xB7 ${this.text("Sign video not supplied","\u12E8\u121D\u120D\u12AD\u1275 \u126A\u12F2\u12EE \u12A0\u120D\u1240\u1228\u1260\u121D")}`}
      · ${this.size(this.manifest.sizeBytes||0)}
    </p>`}render(){let e=this.incomplete?this.text("Retry offline download","\u12E8\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u121B\u12CD\u1228\u12F5\u1295 \u12A5\u1295\u12F0\u1308\u1293 \u121E\u12AD\u122D"):this.text("Download offline pack","\u12E8\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u1325\u1245\u120D \u12A0\u12CD\u122D\u12F5");return g`
      ${this.renderAssets()}
      <div class="row">
        ${this.saved?g`<button
                type="button"
                class="secondary"
                @click=${this.removeOfflineCopy}
                ?disabled=${this.busy}
                aria-label=${this.text("Delete offline copy","\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u12E8\u1270\u1240\u1218\u1320\u12CD\u1295 \u1230\u122D\u12DD")}
              >
                ${this.text("Delete offline copy","\u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u12E8\u1270\u1240\u1218\u1320\u12CD\u1295 \u1230\u122D\u12DD")}
              </button>`:g`<button
                type="button"
                @click=${this.save}
                ?disabled=${this.busy||!this.manifest}
                aria-label=${e}
              >
                ${this.busy?this.text("Downloading\u2026","\u1260\u121B\u12CD\u1228\u12F5 \u120B\u12ED\u2026"):e}
              </button>`}
        ${this.busy?g`<button
                type="button"
                class="secondary"
                @click=${this.cancel}
                aria-label=${this.text("Cancel download","\u121B\u12CD\u1228\u12F5\u1295 \u12A0\u124B\u122D\u1325")}
              >
                ${this.text("Cancel","\u12A0\u124B\u122D\u1325")}
              </button>`:g`<button
                type="button"
                class="secondary"
                @click=${this.refresh}
              >
                ${this.text("Refresh info","\u1218\u1228\u1303 \u12A0\u12F5\u1235")}
              </button>`}
      </div>
      ${this.busy?g`<progress
                max="100"
                .value=${this.progress}
                aria-label=${this.text(`Download progress ${this.progress} percent`,`\u12E8\u121B\u12CD\u1228\u12F5 \u1202\u12F0\u1275 ${this.progress} \u1260\u1218\u1276`)}
              ></progress>
              <p class="progress-text">${this.progress}%</p>`:""}
      <p
        class="status ${this.error?"error":this.saved?"success":""}"
        role="status"
        aria-live="polite"
      >
        ${this.status}
      </p>
      <p class="note">
        ${this.text("Files are kept in this browser\u2019s storage. Open the same lesson page after refreshing once online to use a saved copy without a connection.","\u134B\u12ED\u120E\u1279 \u1260\u12DA\u1205 \u12A0\u1233\u123D \u121B\u12A8\u121B\u127B \u12CD\u1235\u1325 \u12ED\u1240\u1218\u1323\u1209\u1362 \u12A8\u1218\u1235\u1218\u122D \u12CD\u132D \u1208\u1218\u1320\u1240\u121D \u12A2\u1295\u1270\u122D\u1294\u1275 \u12A5\u12EB\u1208 \u1308\u1339\u1295 \u12A0\u1295\u12F5 \u130A\u12DC \u12AB\u12F0\u1231 \u1260\u128B\u120B \u12EB\u1295\u1291 \u12E8\u1275\u121D\u1205\u122D\u1275 \u1308\u133D \u12ED\u12AD\u1348\u1271\u1362")}
      </p>
    `}};h.styles=C`
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
  `,u([v()],h.prototype,"api",2),u([v({attribute:"api-key"})],h.prototype,"apiKey",2),u([v({attribute:"lesson-id"})],h.prototype,"lessonId",2),u([f()],h.prototype,"manifest",2),u([f()],h.prototype,"status",2),u([f()],h.prototype,"busy",2),u([f()],h.prototype,"progress",2),u([f()],h.prototype,"saved",2),u([f()],h.prototype,"incomplete",2),u([f()],h.prototype,"error",2),u([f()],h.prototype,"language",2),h=u([A("savanna-offline")],h);export{h as SavannaOffline};
//# sourceMappingURL=offline-VGHNYGJB.js.map
