import{a as R,b as c,e as k,f as z,g as v,h as b}from"./chunk-2MOXT47L.js";import{a as l}from"./chunk-INEEODZZ.js";function M(s,h){return Math.max(0,s-h/1e3)}function P(s,h,e){return Math.abs(s-M(h,e))>.3+1e-9}var E="savanna.prefs.v1",u=16/9,w=50,A=180,m=8,$=56,y={x:8,y:8,width:320,height:320/u+w};function x(s,h){return typeof s=="number"&&Number.isFinite(s)?s:h}function C(){try{let s=JSON.parse(localStorage.getItem(E)||"{}")?.sign;if(!s||typeof s!="object"||Array.isArray(s))return;let h=["nw","ne","se","sw"].includes(s.corner||"")?s.corner:void 0;return{x:x(s.x,y.x),y:x(s.y,y.y),width:x(s.width,y.width),height:x(s.height,y.height),corner:h}}catch{return}}function F(){return{...y,...C()}}function O(){try{let s=JSON.parse(localStorage.getItem(E)||"{}")?.sign?.enabled;return typeof s=="boolean"?s:void 0}catch{return}}function T(s,h){try{let e=JSON.parse(localStorage.getItem(E)||"{}"),t=e&&typeof e=="object"&&!Array.isArray(e)?e:{},i=t.sign&&typeof t.sign=="object"?t.sign:{};t.sign={...s,...typeof h=="boolean"?{enabled:h}:typeof i.enabled=="boolean"?{enabled:i.enabled}:{}},localStorage.setItem(E,JSON.stringify(t))}catch{}}var o=class extends k{constructor(){super(...arguments);this.src="";this.offsetMs=0;this.lang="";this.enabled=O()??!0;this.position=F();this.hasTrack=!0;this.signUnavailable=!1;this.loading=!1;this.announcement="";this.hasStoredPosition=!!C();this.resizeFrame=0;this.buffering=!1;this.playerReady=()=>{this.bindPlayer(),this.clamp()};this.handleResize=()=>{this.bindPlayer(),cancelAnimationFrame(this.resizeFrame),this.resizeFrame=requestAnimationFrame(this.clamp)};this.clamp=()=>this.apply(this.position);this.language=e=>{let t=e.detail?.lang;t&&(this.lang=t)};this.sync=e=>{let t=e.detail;typeof t?.time=="number"&&this.syncTo(t.time,!!t.paused,t.rate||1)};this.syncFromMain=()=>{this.main&&this.syncTo(this.main.currentTime,this.main.paused,this.main.playbackRate||1)};this.mainWaiting=()=>{this.buffering=!0,this.video?.pause()};this.mainReady=()=>{this.buffering=!1,this.syncFromMain()};this.signReady=()=>{this.loading=!1,this.syncFromMain()};this.signError=()=>{this.loading=!1,this.signUnavailable=!0,this.announcement="Sign language interpretation could not be loaded for this lesson."}}connectedCallback(){super.connectedCallback(),this.slot||(this.slot="overlay"),this.bindPlayer(),this.hasTrack=!!this.src,window.addEventListener("resize",this.handleResize),document.addEventListener("fullscreenchange",this.clamp),window.addEventListener("savanna:lang-change",this.language)}disconnectedCallback(){window.removeEventListener("resize",this.handleResize),cancelAnimationFrame(this.resizeFrame),document.removeEventListener("fullscreenchange",this.clamp),window.removeEventListener("savanna:lang-change",this.language),this.unbindPlayer(),super.disconnectedCallback()}firstUpdated(){if(this.video=this.renderRoot.querySelector("video")||void 0,this.bindPlayer(),!this.hasStoredPosition){let e=this.bounds();this.position={...this.position,x:e.right-this.position.width,y:e.top}}this.clamp()}updated(e){e.has("src")&&(this.hasTrack=!!this.src,this.signUnavailable=!1,this.loading=!!this.src,this.video=this.renderRoot.querySelector("video")||void 0),this.bindPlayer(),e.has("enabled")&&(this.video=this.renderRoot.querySelector("video")||void 0,this.enabled&&this.syncFromMain())}bindPlayer(){let e=this.closest("savanna-player");this.player!==e&&(this.player?.removeEventListener("savanna:ready",this.playerReady),this.player?.removeEventListener("savanna:timeupdate",this.sync),this.player=e||void 0,this.player?.addEventListener("savanna:ready",this.playerReady),this.player?.addEventListener("savanna:timeupdate",this.sync));let t=this.player?.media;this.main!==t&&(this.main?.removeEventListener("waiting",this.mainWaiting),this.main?.removeEventListener("seeking",this.mainWaiting),this.main?.removeEventListener("canplay",this.mainReady),this.main?.removeEventListener("seeked",this.mainReady),this.main?.removeEventListener("playing",this.mainReady),this.main?.removeEventListener("ended",this.syncFromMain),this.main?.removeEventListener("pause",this.syncFromMain),this.main?.removeEventListener("ratechange",this.syncFromMain),this.mediaResizeObserver?.disconnect(),this.mediaResizeObserver=void 0,this.main=t,this.main&&typeof ResizeObserver<"u"&&(this.mediaResizeObserver=new ResizeObserver(this.clamp),this.mediaResizeObserver.observe(this.main)),this.main?.addEventListener("waiting",this.mainWaiting),this.main?.addEventListener("seeking",this.mainWaiting),this.main?.addEventListener("canplay",this.mainReady),this.main?.addEventListener("seeked",this.mainReady),this.main?.addEventListener("playing",this.mainReady),this.main?.addEventListener("ended",this.syncFromMain),this.main?.addEventListener("pause",this.syncFromMain),this.main?.addEventListener("ratechange",this.syncFromMain))}unbindPlayer(){this.player?.removeEventListener("savanna:ready",this.playerReady),this.player?.removeEventListener("savanna:timeupdate",this.sync),this.player=void 0,this.main?.removeEventListener("waiting",this.mainWaiting),this.main?.removeEventListener("seeking",this.mainWaiting),this.main?.removeEventListener("canplay",this.mainReady),this.main?.removeEventListener("seeked",this.mainReady),this.main?.removeEventListener("playing",this.mainReady),this.main?.removeEventListener("ended",this.syncFromMain),this.main?.removeEventListener("pause",this.syncFromMain),this.main?.removeEventListener("ratechange",this.syncFromMain),this.mediaResizeObserver?.disconnect(),this.mediaResizeObserver=void 0,this.main=void 0}bounds(){this.bindPlayer();let e=this.offsetParent;if(!e)return{left:m,top:m,right:innerWidth-m,bottom:innerHeight-$};let t=this.main?.getBoundingClientRect(),i=t?.width||this.main?.clientWidth||e.clientWidth,a=t?.height||this.main?.clientHeight||e.clientHeight;return{left:m,top:m,right:Math.max(m,i-m),bottom:Math.max(m,a-$)}}fit(e){let t=this.bounds(),i=Math.max(1,t.right-t.left),a=Math.max(1,t.bottom-t.top),d=Math.max(1,Math.min(i,(a-w)*u)),p=Math.min(A,d),n=Math.max(p,Math.min(e.width,d)),r=n/u+w;return{width:n,height:r,x:Math.max(t.left,Math.min(e.x,t.right-n)),y:Math.max(t.top,Math.min(e.y,t.bottom-r)),corner:e.corner}}apply(e,t=!0){this.position=this.fit(e),t&&T(this.position),this.style.setProperty("--panel-width",this.position.width+"px");let i=this.offsetParent,a=i?.getBoundingClientRect(),d=this.main?.getBoundingClientRect(),p=i&&a&&d?d.left-a.left-i.clientLeft:0,n=i&&a&&d?d.top-a.top-i.clientTop:0;this.style.left=`${p+this.position.x}px`,this.style.top=`${n+this.position.y}px`}syncTo(e,t,i){if(!this.enabled||!this.video||!this.hasTrack||this.signUnavailable)return;let a=M(e,this.offsetMs);if(P(this.video.currentTime,e,this.offsetMs))try{this.video.currentTime=a}catch{}this.video.playbackRate!==i&&(this.video.playbackRate=i),t||this.buffering?this.video.pause():this.video.paused&&this.video.play().catch(()=>{})}announce(e){this.announcement=`${e}. Position ${Math.round(this.position.x)}, ${Math.round(this.position.y)}. Size ${Math.round(this.position.width)} by ${Math.round(this.position.height)} pixels.`}move(e,t,i=!0){this.apply({...this.position,x:this.position.x+e,y:this.position.y+t,corner:void 0}),this.dispatchEvent(new CustomEvent("savanna:sign-position",{bubbles:!0,composed:!0,detail:this.position})),i&&this.announce("Sign window moved")}resizeBy(e,t,i=!0){let a=Math.abs(e)>=Math.abs(t*u)?e:t*u;this.apply({...this.position,width:this.position.width+a,corner:void 0}),i&&this.announce("Sign window resized")}startDrag(e){e.target.closest("button")||(e.currentTarget.setPointerCapture(e.pointerId),this.drag={x:e.clientX,y:e.clientY,position:this.position})}dragMove(e){this.drag&&(this.apply({...this.drag.position,x:this.drag.position.x+e.clientX-this.drag.x,y:this.drag.position.y+e.clientY-this.drag.y,corner:void 0}),this.dispatchEvent(new CustomEvent("savanna:sign-position",{bubbles:!0,composed:!0,detail:this.position})))}endDrag(){this.drag&&this.announce("Sign window moved"),this.drag=void 0}startResize(e,t){e.currentTarget.setPointerCapture(e.pointerId),this.resize={x:e.clientX,y:e.clientY,position:this.position,corner:t}}resizeMove(e){if(!this.resize)return;let{corner:t,position:i,x:a,y:d}=this.resize,p=e.clientX-a,n=e.clientY-d,r=t.includes("w")?-p:p,L=(t.includes("n")?-n:n)*u,g=i.width+(Math.abs(r)>=Math.abs(L)?r:L),f=g/u+w;this.apply({width:g,height:f,x:t.includes("w")?i.x+i.width-g:i.x,y:t.includes("n")?i.y+i.height-f:i.y})}endResize(){this.resize&&this.announce("Sign window resized"),this.resize=void 0}snap(e){let t=this.bounds(),i=this.position.width,a=this.position.height;this.apply({...this.position,corner:e,x:e.includes("e")?t.right-i:t.left,y:e.includes("s")?t.bottom-a:t.top}),this.announce(`Sign window snapped to the ${e==="nw"?"top left":e==="ne"?"top right":e==="se"?"bottom right":"bottom left"} corner`)}toggle(){this.enabled=!this.enabled,this.enabled||this.video?.pause(),T(this.position,this.enabled),this.announcement=`Sign language ${this.enabled?"enabled":"disabled"}.`,this.dispatchEvent(new CustomEvent("savanna:sign-toggle",{bubbles:!0,composed:!0,detail:{enabled:this.enabled}}))}render(){let e=this.lang==="am"?"\u12E8\u121D\u120D\u12AD\u1275 \u124B\u1295\u124B":"Sign language",t=this.lang==="am"?"\u1208\u12DA\u1205 \u1275\u121D\u1205\u122D\u1275 \u12E8\u121D\u120D\u12AD\u1275 \u126A\u12F2\u12EE \u12E8\u1208\u121D":"Sign language interpretation is not available for this lesson.",i=["nw","ne","se","sw"].map(n=>c`<button
          class="handle ${n}"
          aria-label="Resize sign window from ${n} corner"
          @pointerdown=${r=>this.startResize(r,n)}
          @pointermove=${this.resizeMove}
          @pointerup=${this.endResize}
          @pointercancel=${this.endResize}
        ></button>`),a=["nw","ne","sw","se"].map(n=>c`<button
          @click=${()=>this.snap(n)}
          aria-label="Snap sign window to ${n==="nw"?"top left":n==="ne"?"top right":n==="sw"?"bottom left":"bottom right"}"
        >
          ${n==="nw"?"\u2196":n==="ne"?"\u2197":n==="sw"?"\u2199":"\u2198"}
        </button>`),d=n=>{if(!n.key.startsWith("Arrow"))return;n.preventDefault();let r=n.shiftKey?100:20,g=n.key==="ArrowRight"?r:n.key==="ArrowLeft"?-r:0,f=n.key==="ArrowDown"?r:n.key==="ArrowUp"?-r:0;n.altKey?this.resizeBy(g,f):this.move(g,f)},p=c`<button
      class="toggle"
      type="button"
      aria-label="${e}: ${this.enabled?"on":"off"}"
      aria-pressed=${String(this.enabled)}
      @click=${this.toggle}
    >
      ${this.enabled?"On":"Off"}
    </button>`;return c`<p class="sr-only" role="status" aria-live="polite">${this.announcement}</p>
      ${this.enabled?c`<section aria-label="${e} window">
              <header
                tabindex="0"
                role="group"
                aria-label="${e} window. Use arrow keys to move, Shift plus arrow keys for larger moves, and Alt plus arrow keys to resize."
                @keydown=${d}
                aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Alt+ArrowUp Alt+ArrowDown"
                @pointerdown=${this.startDrag}
                @pointermove=${this.dragMove}
                @pointerup=${this.endDrag}
                @pointercancel=${this.endDrag}
              >
                <strong>${e}</strong><span class="actions">${a}${p}</span>
              </header>
              ${this.hasTrack&&!this.signUnavailable?c`<video .src=${this.src} playsinline muted preload="metadata" aria-label="${e} interpreter video" @loadedmetadata=${this.signReady} @error=${this.signError}></video>${this.loading?c`<div class="fallback loading" role="status">Loading sign-language interpretation…</div>`:""}`:c`<div class="fallback" role="status">${t}</div>`}${i}
            </section>`:p}`}};o.styles=R`
    :host {
      position: absolute;
      z-index: 20;
      display: block;
      width: var(--panel-width, 320px);
      max-width: calc(100% - 16px);
      container-type: inline-size;
      color: #fff;
      font: 16px/1.4 var(--savanna-font, system-ui, sans-serif);
    }
    :host([hidden]) {
      display: none !important;
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
      gap: 4px;
    }
    @container (max-width: 260px) {
      header {
        gap: 4px;
        padding-inline: 4px;
      }
      header > strong {
        font-size: 12px;
      }
      .actions {
        gap: 2px;
      }
      .actions button[aria-label^="Snap sign window"] {
        display: none;
      }
      .handle.nw,
      .handle.ne {
        display: none;
      }
      .actions .toggle {
        min-width: 48px;
        padding-inline: 4px;
      }
    }
    @container (max-width: 180px) {
      header {
        justify-content: center;
      }
      header > strong {
        display: none;
      }
      .actions {
        margin-inline: auto;
      }
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
      min-width: 68px;
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
    @media (forced-colors: active) {
      :host {
        color: CanvasText;
      }
      section,
      header,
      .fallback {
        border-color: ButtonText;
        background: Canvas;
        color: CanvasText;
      }
      button,
      .handle {
        border-color: ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }
      header:focus-visible,
      button:focus-visible {
        outline: 3px solid Highlight;
      }
    }
    @media (max-width: 600px) {
      :host {
        max-width: calc(100% - 12px);
      }
      header {
        min-height: 44px;
        padding-left: 10px;
      }
      button {
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
  `,l([v()],o.prototype,"src",2),l([v({type:Number,attribute:"offset-ms"})],o.prototype,"offsetMs",2),l([v()],o.prototype,"lang",2),l([v({type:Boolean,reflect:!0})],o.prototype,"enabled",2),l([b()],o.prototype,"position",2),l([b()],o.prototype,"hasTrack",2),l([b()],o.prototype,"signUnavailable",2),l([b()],o.prototype,"loading",2),l([b()],o.prototype,"announcement",2),o=l([z("savanna-sign-window")],o);export{o as SavannaSignWindow};
//# sourceMappingURL=sign-window-COXD3B7R.js.map
