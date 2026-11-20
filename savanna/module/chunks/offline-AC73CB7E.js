import{a as M}from"./chunk-QXYEMUCC.js";import{b as _}from"./chunk-LI7YCJHX.js";import{a as j,b as L,e as F,f as K,g as I,h as $}from"./chunk-4E6CAAHO.js";import{a as m}from"./chunk-INEEODZZ.js";function q(r){return typeof r=="object"&&r!==null&&!Array.isArray(r)}function D(r,n){if(!q(r)||r.id!==n)throw new Error("The offline pack belongs to a different lesson.");if(!Number.isSafeInteger(r.version)||r.version<1)throw new Error("The offline pack version is invalid.");if(!Number.isSafeInteger(r.sizeBytes)||r.sizeBytes<0)throw new Error("The offline pack size is invalid.");if(!Array.isArray(r.files))throw new Error("The offline pack file list is missing.");let e=new Set,s=r.files.map(t=>{if(!q(t)||typeof t.path!="string"||!t.path||t.path.includes("..")||t.path.startsWith("/")||t.path.includes("\\"))throw new Error("The offline pack contains an unsafe file path.");let o=t.sizeBytes??t.bytes;if(!Number.isSafeInteger(o)||o<0)throw new Error(`The offline pack size for ${t.path} is invalid.`);if(typeof t.sha256!="string"||!/^[a-f0-9]{64}$/i.test(t.sha256))throw new Error(`The offline pack checksum for ${t.path} is invalid.`);if(e.has(t.path))throw new Error(`The offline pack contains ${t.path} more than once.`);return e.add(t.path),{path:t.path,sizeBytes:o,sha256:t.sha256.toLowerCase()}});if(s.reduce((t,o)=>t+o.sizeBytes,0)!==r.sizeBytes)throw new Error("The offline pack size does not match the sum of its files.");return{id:n,version:r.version,sizeBytes:r.sizeBytes,files:s}}function z(r,n,e,s){let t=[],o=new URL(e,globalThis.location?.href??"http://localhost/"),h=c=>{let i=c.split("/").map(l=>encodeURIComponent(l)).join("/");return new URL(`/media/${i}`,o).href};for(let c of n.files){let i=c.path.split("/").pop().toLowerCase(),l;if(/^(lesson|lesson-audio)\.opus$/.test(i))l=r.media.audio||h(c.path);else if(/^(en|captions-en)\.vtt$/.test(i))l=r.captions.find(a=>a.lang==="en")?.url??h(c.path);else if(/^(am|captions-am)\.vtt$/.test(i))l=r.captions.find(a=>a.lang==="am")?.url??h(c.path);else if(i==="ad.opus"){if(!r.audioDescription)throw new Error(`The offline pack file \u201C${c.path}\u201D is not declared in the lesson manifest.`);l=r.audioDescription.audioUrl}else if(i==="ad.vtt"){if(!r.audioDescription)throw new Error(`The offline pack file \u201C${c.path}\u201D is not declared in the lesson manifest.`);l=r.audioDescription.vttUrl}else if(/^sign\.(mp4|webm)$/.test(i)){if(!r.sign)throw new Error(`The offline pack file \u201C${c.path}\u201D is not declared in the lesson manifest.`);l=r.sign.url}else if(/^lesson-240p\.(mp4|webm)$/.test(i))l=h(c.path);else if(i==="transcript.html")continue;if(!l&&r.sign&&new URL(r.sign.url).pathname.split("/").pop()?.toLowerCase()===i&&(l=r.sign.url),!l)throw new Error(`The offline pack file \u201C${c.path}\u201D is not declared in the lesson manifest.`);t.push({url:l,expectedBytes:c.sizeBytes,expectedSha256:c.sha256})}if(t.length===0)throw new Error("This lesson pack does not contain any downloadable resources.");return t}async function J(r="/media-sw.js"){if(!("serviceWorker"in navigator)||!window.isSecureContext)return null;try{let n=await navigator.serviceWorker.getRegistration(r);if(!navigator.onLine&&n?.active)return await navigator.serviceWorker.ready,await G(),n;let e=await fetch(r,{method:"HEAD",cache:"no-store"});if(!e.ok||!e.headers.get("content-type")?.toLowerCase().includes("javascript"))return null;let s=await navigator.serviceWorker.register(r,{scope:"/"});return await navigator.serviceWorker.ready,await G(),navigator.storage?.persist&&await navigator.storage.persist().catch(()=>!1),s}catch{return null}}async function G(){let r=await caches.open("savanna-media-v2-static"),n=new Set([window.location.href]);for(let e of document.querySelectorAll('script[src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]')){let s=e instanceof HTMLScriptElement?e.src:e.href;s&&new URL(s).origin===window.location.origin&&n.add(s)}for(let e of n){let s=new URL(e);if(!(s.pathname.startsWith("/v1/")||s.pathname.startsWith("/api/v1/")))try{let t=await fetch(e,{credentials:"same-origin",cache:"no-store"});t.ok&&await r.put(e,t)}catch{}}}var A="savanna.prefs.v1",Y="savanna-pack-",P=256*1024,V=/^([A-Za-z0-9_-]{1,80})$/;function S(){try{let n=JSON.parse(localStorage.getItem(A)||"{}")?.offline;return{savedLessons:Array.isArray(n?.savedLessons)?n.savedLessons.filter(e=>typeof e=="string"):[],partials:n?.partials&&typeof n.partials=="object"&&!Array.isArray(n.partials)?n.partials:{}}}catch{return{savedLessons:[],partials:{}}}}function E(r){try{let n=JSON.parse(localStorage.getItem(A)||"{}"),e=n&&typeof n=="object"&&!Array.isArray(n)?n:{};e.offline=r,localStorage.setItem(A,JSON.stringify(e))}catch{}}function O(r,n){return`${Y}${r}-v${n}`}function U(r,n,e){let s=new URL(`/__savanna_offline__/${encodeURIComponent(r)}/${n}/${e}`,location.origin);return new Request(s.href)}function Z(r){let n=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(r||"");if(!n)return null;let e=Number(n[1]),s=Number(n[2]),t=Number(n[3]);return Number.isSafeInteger(e)&&Number.isSafeInteger(s)&&Number.isSafeInteger(t)&&e<=s&&s<t?{start:e,end:s,total:t}:null}var d=class extends F{constructor(){super(...arguments);this.api="";this.apiKey="";this.lessonId="";this.lang="en";this.manifest=null;this.status="Load a lesson pack to begin.";this.busy=!1;this.progress=0;this.saved=!1;this.canResume=!1;this.lessonManifest=null;this.generation=0;this.connectionGeneration=0;this.serviceWorkerReady=!1;this.refreshClick=()=>{this.refresh()};this.saveClick=()=>{this.save()};this.removeClick=()=>{this.removeSavedCopy()}}connectedCallback(){super.connectedCallback(),this.refreshSavedState();let e=++this.connectionGeneration;J().finally(()=>{!this.isConnected||e!==this.connectionGeneration||(this.serviceWorkerReady=!0,this.refresh())})}disconnectedCallback(){this.connectionGeneration++,this.serviceWorkerReady=!1,this.controller?.abort(),this.refreshController?.abort(),super.disconnectedCallback()}updated(e){(e.has("api")||e.has("apiKey")||e.has("lessonId"))&&(this.generation++,this.refreshController?.abort(),this.manifest=null,this.lessonManifest=null,this.progress=0,this.refreshSavedState(),this.serviceWorkerReady&&this.api&&this.lessonId&&this.refresh())}refreshSavedState(){let e=S();this.saved=e.savedLessons.includes(this.lessonId),this.canResume=!!e.partials[this.lessonId]}apiUrl(e){let s=new URL(this.api,document.baseURI);if(s.protocol!=="https:"&&s.protocol!=="http:")throw new Error("The API URL must use HTTP or HTTPS.");return new URL(e,s).href}apiHeaders(e){return _(e,this.apiKey,this.api)?{"X-Savanna-Key":this.apiKey}:{}}parsePackForLesson(e,s){let t=D(s,e.id);if(!e.pack||t.sizeBytes!==e.pack.sizeBytes)throw new Error("The lesson and offline pack report different download sizes. Refresh the lesson data and try again.");return t}async refresh(){if(!this.api||!this.lessonId||!V.test(this.lessonId)){this.status="Enter a valid lesson id and API address to load offline options.";return}let e=++this.generation;this.refreshController?.abort();let s=new AbortController;this.refreshController=s,this.status="Checking lesson and offline pack\u2026";try{let t=this.apiUrl(`/v1/lessons/${encodeURIComponent(this.lessonId)}`),o,h=!1;try{let a=await fetch(t,{headers:this.apiHeaders(t),signal:s.signal});if(!a.ok)throw new Error(a.status===404?"This lesson is not available.":`Lesson request failed (${a.status}).`);o=M(await a.json(),this.lessonId)}catch(a){if(s.signal.aborted)throw a;let g=localStorage.getItem(`savanna.cached_manifest.${this.lessonId}`);if(!g)throw a;try{o=M(JSON.parse(g),this.lessonId),h=!0}catch{throw a}}if(!o.pack)throw new Error("This lesson does not have an offline pack.");let c=new URL(o.pack.manifestUrl,this.apiUrl("/")).href,i=await fetch(c,{headers:this.apiHeaders(c),signal:s.signal});if(!i.ok)throw new Error(i.status===404?"An offline pack has not been published for this lesson.":`Pack request failed (${i.status}).`);let l=this.parsePackForLesson(o,await i.json());if(e!==this.generation)return;if(this.lessonManifest=o,this.manifest=l,this.refreshSavedState(),this.saved&&typeof caches<"u"){let a=await caches.open(O(this.lessonId,l.version)),g=z(o,l,this.api,this.apiKey);if(!(await Promise.all(g.map(async w=>{let u=await a.match(w.url);if(!u)return!1;try{return await this.verifyResource(w,await u.arrayBuffer()),!0}catch{return await a.delete(w.url),!1}}))).every(Boolean)){let w=S();w.savedLessons=w.savedLessons.filter(u=>u!==this.lessonId),E(w),this.saved=!1}}this.status=`${h?"Offline pack ready":"Pack ready"} \xB7 ${this.formatSize(l.sizeBytes)}${this.saved?" \xB7 Saved offline":this.canResume?" \xB7 Download can resume":""}`}catch(t){if(s.signal.aborted||e!==this.generation)return;this.manifest=null,this.status=t instanceof Error?t.message:"The offline pack could not be loaded."}finally{this.refreshController===s&&(this.refreshController=void 0)}}formatSize(e){return e<1024?`${e} B`:e<1024*1024?`${(e/1024).toFixed(1)} KB`:`${(e/(1024*1024)).toFixed(2)} MB`}async ensureStorage(e){if(!navigator.storage?.estimate)return;let s=await navigator.storage.estimate();if((s.quota??Number.POSITIVE_INFINITY)-(s.usage??0)<e)throw new Error("There is not enough device storage for this download. Free space and try again.")}async verifyResource(e,s){if(e.expectedBytes!==void 0&&s.byteLength!==e.expectedBytes)throw new Error(`The downloaded file size does not match the offline pack for ${new URL(e.url).pathname.split("/").pop()}.`);if(!globalThis.crypto?.subtle)throw new Error("This browser cannot verify offline file checksums. Use a current browser over HTTPS or localhost.");let t=await globalThis.crypto.subtle.digest("SHA-256",s);if(Array.from(new Uint8Array(t),h=>h.toString(16).padStart(2,"0")).join("")!==e.expectedSha256)throw new Error(`The checksum for ${new URL(e.url).pathname.split("/").pop()} does not match the offline pack. Its partial download was removed; try again.`)}async discardPartial(e,s,t){for(let h=0;h<t;h+=P)await e.delete(U(this.lessonId,s,h));let o=S();delete o.partials[this.lessonId],E(o),this.canResume=!1}async save(){if(this.busy||!this.manifest)return;if(typeof caches>"u"){this.status="Offline saving is unavailable in this browser. Open the lesson over HTTPS or localhost and enable site storage.";return}let e=this.apiUrl(`/v1/lessons/${encodeURIComponent(this.lessonId)}`);this.busy=!0,this.progress=0,this.controller=new AbortController;let s=this.controller,t=this.generation;try{let o=this.lessonManifest;if(!o){let f=await fetch(e,{headers:this.apiHeaders(e),signal:s.signal});if(!f.ok)throw new Error(`Lesson request failed (${f.status}).`);o=M(await f.json(),this.lessonId)}if(!o.pack)throw new Error("This lesson does not have an offline pack.");let h=new URL(o.pack.manifestUrl,this.apiUrl("/")).href,c=await fetch(h,{headers:this.apiHeaders(h),signal:s.signal});if(!c.ok)throw new Error(`Pack request failed (${c.status}).`);let i=this.parsePackForLesson(o,await c.json());if(t!==this.generation)return;let l=z(o,i,this.api,this.apiKey),a=await caches.open(O(this.lessonId,i.version)),g=S(),N=l.reduce((f,p)=>f+(p.expectedBytes??0),0),w=Math.max(i.sizeBytes,N),u=0;for(let f of l){let p=await a.match(f.url);if(p){let x=await p.arrayBuffer();try{await this.verifyResource(f,x)}catch{await a.delete(f.url),p=void 0}p&&(u+=x.byteLength)}}for(let f=0;f<l.length;f++){let p=l[f];if(await a.match(p.url)){this.progress=Math.round(Math.min(1,u/Math.max(1,w))*100);continue}let x=g.partials[this.lessonId]?.version===i.version?await this.readPartial(a,f):{offset:0,total:0,chunks:[]},y=x.offset,b=x.total,W=x.chunks,H=!1;for(;!b||y<b;){let k=b?Math.min(y+P-1,b-1):y+P-1,R=await fetch(p.url,{headers:{...p.headers,Range:`bytes=${y}-${k}`},signal:s.signal});if(R.status!==206){if(R.status===200&&y===0){if((Number(R.headers.get("Content-Length"))||p.expectedBytes||0)>P)throw new Error(`The server does not support resumable byte ranges for ${new URL(p.url).pathname.split("/").pop()}.`);let C=await R.arrayBuffer();await this.verifyResource(p,C),await this.ensureStorage(C.byteLength),await a.put(p.url,new Response(C,{headers:{"Content-Type":R.headers.get("Content-Type")||X(p.url),"Content-Length":String(C.byteLength)}})),u+=C.byteLength,this.progress=Math.round(Math.min(99,u/Math.max(1,w)*100)),H=!0;break}throw new Error(`Download failed (${R.status}) for ${new URL(p.url).pathname.split("/").pop()}.`)}let v=Z(R.headers.get("Content-Range"));if(!v||v.start!==y||v.end>k||b&&v.total!==b||p.expectedBytes!==void 0&&v.total!==p.expectedBytes)throw new Error("The server returned an invalid byte range. The download was paused safely.");await this.ensureStorage(v.end-v.start+1),b=v.total;let B=await R.arrayBuffer();if(B.byteLength!==v.end-v.start+1)throw new Error("The downloaded chunk was incomplete. Resume the download to continue.");await a.put(U(this.lessonId,f,y),new Response(B,{headers:{"Content-Length":String(B.byteLength),"X-Savanna-Total":String(b)}})),W.push(new Response(B)),y=v.end+1,g.partials[this.lessonId]={version:i.version,bytes:u+y},E(g),this.canResume=!0,this.progress=Math.round(Math.min(99,(u+y)/Math.max(1,w)*100)),this.status=`Saving lesson resources \xB7 ${this.progress}%`}if(H)continue;let T=new Blob(await Promise.all(W.map(k=>k.blob())),{type:X(p.url)});try{await this.verifyResource(p,await T.arrayBuffer())}catch(k){throw await this.discardPartial(a,f,b),k}await this.ensureStorage(T.size),await a.put(p.url,new Response(T,{headers:{"Content-Type":T.type,"Content-Length":String(T.size)}}));for(let k=0;k<b;k+=P)await a.delete(U(this.lessonId,f,k));u+=T.size,this.progress=Math.round(Math.min(99,u/Math.max(1,w)*100))}g.savedLessons=[...new Set([...g.savedLessons,this.lessonId])],delete g.partials[this.lessonId],E(g),this.saved=!0,this.canResume=!1,this.progress=100,this.status=`Saved offline \xB7 ${this.formatSize(u)}`}catch(o){s.signal.aborted?(this.status="Download paused. Your completed chunks are saved; choose Resume to continue.",this.canResume=!0):(this.status=o instanceof Error?o.message:"The offline download failed. Try again.",this.canResume=!!S().partials[this.lessonId])}finally{this.controller===s&&(this.controller=void 0),this.busy=!1}}async readPartial(e,s){let t=[],o=0,h=0;for(;;){let c=await e.match(U(this.lessonId,s,o));if(!c)break;let i=await c.arrayBuffer();if(i.byteLength===0||(t.push(new Response(i)),o+=i.byteLength,h||(h=Number(c.headers.get("X-Savanna-Total"))||0),h&&o>=h))break}return{offset:o,total:h,chunks:t}}pause(){this.controller?.abort()}async removeSavedCopy(){if(this.busy)return;let e=S(),s=`${Y}${this.lessonId}-`;for(let t of await caches.keys())t.startsWith(s)&&await caches.delete(t);e.savedLessons=e.savedLessons.filter(t=>t!==this.lessonId),delete e.partials[this.lessonId],E(e),this.saved=!1,this.canResume=!1,this.progress=0,this.status="Offline copy deleted from this device."}render(){let e=this.manifest?this.formatSize(this.manifest.sizeBytes):"";return L`
      <div class="row">
        ${this.saved?L`<button type="button" @click=${this.removeClick} ?disabled=${this.busy}>
                Delete offline copy
              </button>`:L`<button
                type="button"
                @click=${this.saveClick}
                ?disabled=${this.busy||!this.manifest}
              >
                ${this.busy?"Saving\u2026":this.canResume?"Resume download":"Save for offline"}${e?L` <span class="size">(${e})</span>`:""}
              </button>`}
        ${this.busy?L`<button type="button" @click=${this.pause} aria-label="Pause offline download">
                Pause
              </button>`:L`<button
                type="button"
                @click=${this.refreshClick}
                ?disabled=${!this.api||!this.lessonId}
              >
                Refresh
              </button>`}
      </div>
      ${this.busy||this.progress>0?L`<div class="progress-container">
              <progress
                max="100"
                .value=${this.progress}
                aria-label=${`Offline download progress ${this.progress}%`}
              ></progress>
              <p class="progress-text">${this.progress}%</p>
            </div>`:""}
      <p class="status" role="status" aria-live="polite" aria-atomic="true">${this.status}</p>
    `}};d.styles=j`
    :host {
      display: block;
      color: inherit;
      font:
        16px/1.5 system-ui,
        sans-serif;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    button {
      min-height: 44px;
      padding: 8px 14px;
      border: 1px solid #594267;
      border-radius: 8px;
      background: #5b3477;
      color: #fff;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: #4a2a62;
    }
    button:focus-visible {
      outline: 3px solid #e09b00;
      outline-offset: 3px;
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    progress {
      width: min(100%, 360px);
      height: 20px;
    }
    .progress-container {
      margin: 12px 0;
    }
    .progress-text {
      margin: 6px 0 0;
    }
    .size {
      font-size: 0.875em;
      opacity: 0.9;
    }
    .status {
      margin: 0.75rem 0;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      color: #0f172a;
      overflow-wrap: anywhere;
    }
    @media (forced-colors: active) {
      .status {
        forced-color-adjust: none;
        border-color: CanvasText;
        background: Canvas;
        color: CanvasText;
      }
      button {
        forced-color-adjust: none;
        border-color: ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }
      button:focus-visible {
        outline-color: Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        transition: none !important;
      }
    }
  `,m([I()],d.prototype,"api",2),m([I({attribute:"api-key"})],d.prototype,"apiKey",2),m([I({attribute:"lesson-id"})],d.prototype,"lessonId",2),m([I()],d.prototype,"lang",2),m([$()],d.prototype,"manifest",2),m([$()],d.prototype,"status",2),m([$()],d.prototype,"busy",2),m([$()],d.prototype,"progress",2),m([$()],d.prototype,"saved",2),m([$()],d.prototype,"canResume",2),d=m([K("savanna-offline")],d);function X(r){let n=new URL(r).pathname.toLowerCase();return n.endsWith(".vtt")?"text/vtt":n.endsWith(".opus")?"audio/ogg":n.endsWith(".webm")?"video/webm":n.endsWith(".mp4")?"video/mp4":n.includes("/transcript")?"application/json":"application/octet-stream"}export{d as SavannaOffline};
//# sourceMappingURL=offline-AC73CB7E.js.map
