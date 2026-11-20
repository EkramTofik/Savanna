import{a as R,b as c,e as z,f as P,g as b,h as v}from"./chunk-2MOXT47L.js";import{a as d}from"./chunk-INEEODZZ.js";function E(s,p){return Math.max(0,s-p/1e3)}function C(s,p,t){return Math.abs(s-E(p,t))>.3+1e-9}var M="savanna.prefs.v1",m=16/9,$=48,k=96,D=180,r=8,L=56,y={x:8,y:8,width:320,height:320/m+$};function w(s,p){return typeof s=="number"&&Number.isFinite(s)?s:p}function H(){try{let s=JSON.parse(localStorage.getItem(M)||"{}")?.sign;if(!s||typeof s!="object"||Array.isArray(s))return;let p=["nw","ne","se","sw"].includes(s.corner||"")?s.corner:void 0;return{x:w(s.x,y.x),y:w(s.y,y.y),width:w(s.width,y.width),height:w(s.height,y.height),corner:p}}catch{return}}function F(){return{...y,...H()}}function O(){try{let s=JSON.parse(localStorage.getItem(M)||"{}")?.sign?.enabled;return typeof s=="boolean"?s:void 0}catch{return}}function A(s,p){try{let t=JSON.parse(localStorage.getItem(M)||"{}"),e=t&&typeof t=="object"&&!Array.isArray(t)?t:{},i=e.sign&&typeof e.sign=="object"?e.sign:{};e.sign={...s,...typeof p=="boolean"?{enabled:p}:typeof i.enabled=="boolean"?{enabled:i.enabled}:{}},localStorage.setItem(M,JSON.stringify(e))}catch{}}var h=class extends z{constructor(){super(...arguments);this.src="";this.offsetMs=0;this.lang="";this.languageName="";this.enabled=O()??!0;this.position=F();this.hasTrack=!0;this.signUnavailable=!1;this.loading=!1;this.announcement="";this.hasStoredPosition=!!H();this.buffering=!1;this.clamp=()=>this.apply(this.position);this.language=t=>{let e=t.detail?.lang;e&&(this.lang=e)};this.sync=t=>{let e=t.detail;typeof e?.time=="number"&&this.syncTo(e.time,!!e.paused,e.rate||1)};this.syncFromMain=()=>{this.main&&this.syncTo(this.main.currentTime,this.main.paused,this.main.playbackRate||1)};this.mainWaiting=()=>{this.buffering=!0,this.video?.pause()};this.mainReady=()=>{this.buffering=!1,this.syncFromMain()};this.signReady=()=>{this.loading=!1,this.syncFromMain()};this.signError=()=>{this.loading=!1,this.signUnavailable=!0,this.announcement="Sign language interpretation could not be loaded for this lesson."}}bindMainMedia(){let t=this.player?.media;!t||t===this.main||(this.unbindMainMedia(),this.main=t,this.main.addEventListener("waiting",this.mainWaiting),this.main.addEventListener("seeking",this.mainWaiting),this.main.addEventListener("canplay",this.mainReady),this.main.addEventListener("seeked",this.mainReady),this.main.addEventListener("playing",this.mainReady),this.main.addEventListener("ended",this.syncFromMain),this.main.addEventListener("pause",this.syncFromMain),this.main.addEventListener("ratechange",this.syncFromMain),this.syncFromMain())}unbindMainMedia(){this.main&&(this.main.removeEventListener("waiting",this.mainWaiting),this.main.removeEventListener("seeking",this.mainWaiting),this.main.removeEventListener("canplay",this.mainReady),this.main.removeEventListener("seeked",this.mainReady),this.main.removeEventListener("playing",this.mainReady),this.main.removeEventListener("ended",this.syncFromMain),this.main.removeEventListener("pause",this.syncFromMain),this.main.removeEventListener("ratechange",this.syncFromMain),this.main=void 0)}connectedCallback(){super.connectedCallback(),this.slot||(this.slot="overlay"),this.player=this.closest("savanna-player"),this.bindMainMedia(),this.hasTrack=!!this.src,window.addEventListener("resize",this.clamp),window.addEventListener("savanna:lang-change",this.language),this.player?.addEventListener("savanna:timeupdate",this.sync)}disconnectedCallback(){window.removeEventListener("resize",this.clamp),window.removeEventListener("savanna:lang-change",this.language),this.player?.removeEventListener("savanna:timeupdate",this.sync),this.unbindMainMedia(),super.disconnectedCallback()}firstUpdated(){if(this.video=this.renderRoot.querySelector("video")||void 0,Promise.resolve(this.player?.updateComplete).then(()=>this.bindMainMedia()),!this.hasStoredPosition){let t=this.bounds();this.position={...this.position,x:t.right-this.position.width,y:t.top}}this.clamp()}updated(t){t.has("src")&&(this.hasTrack=!!this.src,this.signUnavailable=!1,this.loading=!!this.src,this.video=this.renderRoot.querySelector("video")||void 0),t.has("enabled")&&(this.video=this.renderRoot.querySelector("video")||void 0,this.enabled&&this.syncFromMain())}bounds(){let t=this.player?.shadowRoot?.querySelector(".overlay");if(t)return{left:r,top:r,right:Math.max(r,t.clientWidth-r),bottom:Math.max(r,t.clientHeight-L)};let e=this.offsetParent;if(!e)return{left:r,top:r,right:innerWidth-r,bottom:innerHeight-L};let i=e.getBoundingClientRect(),a=window.visualViewport,u=Math.max(i.left,a?.offsetLeft||0),l=Math.max(i.top,a?.offsetTop||0),n=Math.min(i.right,(a?.offsetLeft||0)+(a?.width||innerWidth)),o=Math.min(i.bottom,(a?.offsetTop||0)+(a?.height||innerHeight));return{left:Math.max(r,u-i.left+r),top:Math.max(r,l-i.top+r),right:Math.max(r,n-i.left-r),bottom:Math.max(r,o-i.top-L)}}fit(t){let e=this.bounds(),i=matchMedia("(max-width: 600px)").matches?k:$,a=Math.max(1,e.right-e.left),u=Math.max(1,e.bottom-e.top),l=Math.max(1,Math.min(a,(u-i)*m)),n=Math.min(D,l),o=Math.max(n,Math.min(t.width,l)),g=o/m+i;return{width:o,height:g,x:Math.max(e.left,Math.min(t.x,e.right-o)),y:Math.max(e.top,Math.min(t.y,e.bottom-g)),corner:t.corner}}apply(t,e=!0){this.position=this.fit(t),e&&A(this.position),this.style.left=`${this.position.x}px`,this.style.top=`${this.position.y}px`,this.style.setProperty("--panel-width",this.position.width+"px")}syncTo(t,e,i){if(!this.enabled||!this.video||!this.hasTrack||this.signUnavailable)return;let a=E(t,this.offsetMs);if(C(this.video.currentTime,t,this.offsetMs))try{this.video.currentTime=a}catch{}this.video.playbackRate!==i&&(this.video.playbackRate=i),e||this.buffering?this.video.pause():this.video.paused&&this.video.play().catch(()=>{})}announce(t){this.announcement=`${t}. Position ${Math.round(this.position.x)}, ${Math.round(this.position.y)}. Size ${Math.round(this.position.width)} by ${Math.round(this.position.height)} pixels.`}move(t,e,i=!0){this.apply({...this.position,x:this.position.x+t,y:this.position.y+e,corner:void 0}),this.dispatchEvent(new CustomEvent("savanna:sign-position",{bubbles:!0,composed:!0,detail:this.position})),i&&this.announce("Sign window moved")}resizeBy(t,e,i=!0){let a=Math.abs(t)>=Math.abs(e*m)?t:e*m;this.apply({...this.position,width:this.position.width+a,corner:void 0}),i&&this.announce("Sign window resized")}startDrag(t){t.target.closest("button")||(t.currentTarget.setPointerCapture(t.pointerId),this.drag={x:t.clientX,y:t.clientY,position:this.position})}dragMove(t){this.drag&&(this.apply({...this.drag.position,x:this.drag.position.x+t.clientX-this.drag.x,y:this.drag.position.y+t.clientY-this.drag.y,corner:void 0}),this.dispatchEvent(new CustomEvent("savanna:sign-position",{bubbles:!0,composed:!0,detail:this.position})))}endDrag(){this.drag&&this.announce("Sign window moved"),this.drag=void 0}startResize(t,e){t.currentTarget.setPointerCapture(t.pointerId),this.resize={x:t.clientX,y:t.clientY,position:this.position,corner:e}}resizeMove(t){if(!this.resize)return;let{corner:e,position:i,x:a,y:u}=this.resize,l=t.clientX-a,n=t.clientY-u,o=e.includes("w")?-l:l,g=(e.includes("n")?-n:n)*m,f=i.width+(Math.abs(o)>=Math.abs(g)?o:g),x=matchMedia("(max-width: 600px)").matches?k:$,T=f/m+x;this.apply({width:f,height:T,x:e.includes("w")?i.x+i.width-f:i.x,y:e.includes("n")?i.y+i.height-T:i.y})}endResize(){this.resize&&this.announce("Sign window resized"),this.resize=void 0}snap(t){let e=this.bounds(),i=this.position.width,a=this.position.height;this.apply({...this.position,corner:t,x:t.includes("e")?e.right-i:e.left,y:t.includes("s")?e.bottom-a:e.top}),this.announce(`Sign window snapped to the ${t==="nw"?"top left":t==="ne"?"top right":t==="se"?"bottom right":"bottom left"} corner`)}toggle(){this.enabled=!this.enabled,this.enabled||this.video?.pause(),A(this.position,this.enabled),this.announcement=`Sign language ${this.enabled?"enabled":"disabled"}.`,this.dispatchEvent(new CustomEvent("savanna:sign-toggle",{bubbles:!0,composed:!0,detail:{enabled:this.enabled}}))}render(){let t=this.languageName||(this.lang==="am"?"\u12E8\u121D\u120D\u12AD\u1275 \u124B\u1295\u124B":"Sign language"),e=this.lang==="am"?"\u1208\u12DA\u1205 \u1275\u121D\u1205\u122D\u1275 \u12E8\u121D\u120D\u12AD\u1275 \u126A\u12F2\u12EE \u12E8\u1208\u121D":"Sign language interpretation is not available for this lesson.",i=["nw","ne","se","sw"].map(n=>c`<button
          class="handle ${n}"
          aria-label="Resize sign window from ${n} corner"
          @pointerdown=${o=>this.startResize(o,n)}
          @pointermove=${this.resizeMove}
          @pointerup=${this.endResize}
          @pointercancel=${this.endResize}
        ></button>`),a=["nw","ne","sw","se"].map(n=>c`<button
          @click=${()=>this.snap(n)}
          aria-label="Snap sign window to ${n==="nw"?"top left":n==="ne"?"top right":n==="sw"?"bottom left":"bottom right"}"
        >
          ${n==="nw"?"\u2196":n==="ne"?"\u2197":n==="sw"?"\u2199":"\u2198"}
        </button>`),u=n=>{if(!n.key.startsWith("Arrow"))return;n.preventDefault();let o=n.shiftKey?100:20,f=n.key==="ArrowRight"?o:n.key==="ArrowLeft"?-o:0,x=n.key==="ArrowDown"?o:n.key==="ArrowUp"?-o:0;n.altKey?this.resizeBy(f,x):this.move(f,x)},l=c`<button
      class="toggle"
      type="button"
      aria-label="${t}: ${this.enabled?"on":"off"}"
      aria-pressed=${String(this.enabled)}
      @click=${this.toggle}
    >
      ${this.enabled?"On":"Off"}
    </button>`;return c`<p class="sr-only" role="status" aria-live="polite">${this.announcement}</p>
      ${this.enabled?c`<section aria-label="${t} window">
              <header
                tabindex="0"
                role="group"
                aria-label="${t} window. Use arrow keys to move, Shift plus arrow keys for larger moves, and Alt plus arrow keys to resize."
                @keydown=${u}
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Alt+ArrowUp Alt+ArrowDown"
                @pointerdown=${this.startDrag}
                @pointermove=${this.dragMove}
                @pointerup=${this.endDrag}
                @pointercancel=${this.endDrag}
              >
                <strong>${t}</strong><span class="actions">${a}${l}</span>
              </header>
              ${this.hasTrack&&!this.signUnavailable?c`<video .src=${this.src} playsinline muted preload="metadata" aria-label="${t} interpreter video" @loadedmetadata=${this.signReady} @error=${this.signError}></video>${this.loading?c`<div class="fallback loading" role="status">Loading sign-language interpretation…</div>`:""}`:c`<div class="fallback" role="status">${e}</div>`}${i}
            </section>`:l}`}};h.styles=R`
    :host([hidden]) {
      display: none !important;
    }
    :host {
      position: absolute;
      z-index: 20;
      display: block;
      width: var(--panel-width, 320px);
      max-width: calc(100% - 16px);
      color: #fff;
      font: 16px/1.4 var(--savanna-font, system-ui, sans-serif);
    }
    :host(:not([enabled])) {
      width: auto;
      max-width: none;
    }
    section {
      position: relative;
      overflow: hidden;
      background: #16131a;
      border: 1px solid #ffffff73;
      border-radius: var(--savanna-radius, 8px);
      box-shadow: 0 8px 24px #0009;
      transition:
        border-color 0.2s,
        box-shadow 0.2s;
    }
    section:has(header:focus-visible) {
      border-color: var(--savanna-focus, #ffbf47);
      box-shadow:
        0 0 0 3px var(--savanna-focus, #ffbf47),
        0 8px 24px #0009;
    }
    section:has(header:active) {
      border-color: #fff;
      box-shadow:
        0 0 0 2px #fff,
        0 8px 24px #0009;
    }
    header {
      display: flex;
      min-height: 48px;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0 6px 0 12px;
      background: #27202d;
      touch-action: none;
      cursor: grab;
      user-select: none;
    }
    header:active {
      cursor: grabbing;
      background: #372841;
    }
    header:focus-visible {
      outline: none;
    }
    strong {
      font-size: 14px;
    }
    .actions {
      display: flex;
      flex: 0 0 auto;
      gap: 2px;
    }
    .actions > button:not(.toggle) {
      min-width: 32px;
      min-height: 32px;
      padding: 0;
    }
    button {
      display: grid;
      min-width: 36px;
      min-height: 36px;
      place-items: center;
      border: 1px solid #ffffff66;
      border-radius: 5px;
      background: #3d3049;
      color: #fff;
      font: inherit;
      cursor: pointer;
    }
    button:hover {
      background: #594267;
    }
    button:focus-visible {
      outline: 3px solid var(--savanna-focus, #ffbf47);
      outline-offset: 2px;
    }
    .toggle {
      min-width: 64px;
      padding: 0 10px;
      font-size: 13px;
      font-weight: 700;
    }
    .toggle[aria-pressed="true"] {
      background: var(--savanna-accent, #6e4a8e);
    }
    video {
      display: block;
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: contain;
      background: #08070a;
    }
    .fallback {
      display: grid;
      min-height: 180px;
      place-items: center;
      padding: 16px;
      text-align: center;
      color: #f4eef8;
      background: #18151c;
    }
    .loading {
      position: absolute;
      inset: 48px 0 0;
      min-height: 0;
      background: #18151ccc;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .handle {
      position: absolute;
      z-index: 1;
      width: 20px;
      min-width: 20px;
      height: 20px;
      min-height: 20px;
      padding: 0;
      border: 2px solid #fff;
      border-radius: 4px;
      background: var(--savanna-accent, #6e4a8e);
      touch-action: none;
    }
    .nw {
      top: 4px;
      left: 4px;
      cursor: nwse-resize;
    }
    .ne {
      top: 4px;
      right: 4px;
      cursor: nesw-resize;
    }
    .se {
      right: 4px;
      bottom: 4px;
      cursor: nwse-resize;
    }
    .sw {
      bottom: 4px;
      left: 4px;
      cursor: nesw-resize;
    }
    @media (max-width: 600px) {
      :host {
        max-width: calc(100% - 12px);
      }
      header {
        min-height: ${k}px;
        padding: 6px;
        flex-wrap: wrap;
        align-content: center;
        gap: 4px;
      }
      strong {
        flex: 1 1 100%;
      }
      .actions {
        flex: 1 1 100%;
        justify-content: space-between;
        gap: 4px;
      }
      button {
        min-width: 40px;
        min-height: 40px;
      }
      .actions > button:not(.toggle) {
        min-width: 40px;
        min-height: 40px;
      }
      .toggle {
        min-width: 72px;
      }
      .handle {
        width: 24px;
        min-width: 24px;
        height: 24px;
        min-height: 24px;
      }
      .fallback {
        min-height: 120px;
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
  `,d([b()],h.prototype,"src",2),d([b({type:Number,attribute:"offset-ms"})],h.prototype,"offsetMs",2),d([b()],h.prototype,"lang",2),d([b({attribute:"language-name"})],h.prototype,"languageName",2),d([b({type:Boolean,reflect:!0})],h.prototype,"enabled",2),d([v()],h.prototype,"position",2),d([v()],h.prototype,"hasTrack",2),d([v()],h.prototype,"signUnavailable",2),d([v()],h.prototype,"loading",2),d([v()],h.prototype,"announcement",2),h=d([P("savanna-sign-window")],h);export{h as SavannaSignWindow};
//# sourceMappingURL=sign-window-SS7H55D3.js.map
