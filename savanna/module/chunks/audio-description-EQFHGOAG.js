import{a as v}from"./chunk-UFQ6XX3Z.js";import{a as x,d as g}from"./chunk-LI7YCJHX.js";import{a as b,b as n,c as h,e as y,f as m,g as r,h as d}from"./chunk-4E6CAAHO.js";import{a}from"./chunk-INEEODZZ.js";var c="savanna.prefs.v1",p={en:{on:"Audio description is on.",off:"Audio description is off.",unavailable:"Recorded audio description is not available for this lesson.",textUnavailable:"Text descriptions are not available for this lesson.",loading:"Loading text descriptions.",loadError:"Text description could not be loaded. Check your connection and retry.",playing:"Audio description playing.",playBlocked:"Audio description is ready. Press Play description to start it.",paused:"Audio description paused with the lesson.",stopped:"Audio description stopped.",finished:"Description finished.",failed:"Recorded description failed to load.",mode:"Mode",recorded:"Recorded audio",text:"Text descriptions",play:"Play description",stop:"Stop",extended:"Extended AD (pause the lesson video)"},am:{on:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B \u1260\u122D\u1277\u120D\u1362",off:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B \u1320\u134D\u1277\u120D\u1362",unavailable:"\u1208\u12DA\u1205 \u1275\u121D\u1205\u122D\u1275 \u12E8\u1270\u1240\u12F3 \u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B \u12E8\u1208\u121D\u1362",textUnavailable:"\u1208\u12DA\u1205 \u1275\u121D\u1205\u122D\u1275 \u12E8\u133D\u1211\u134D \u1218\u130D\u1208\u132B \u12E8\u1208\u121D\u1362",loading:"\u12E8\u133D\u1211\u134D \u1218\u130D\u1208\u132B\u12CE\u127D \u1260\u1218\u132B\u1295 \u120B\u12ED \u1293\u1278\u12CD\u1362",loadError:"\u12E8\u133D\u1211\u134D \u1218\u130D\u1208\u132B\u12CD \u1218\u132B\u1295 \u12A0\u120D\u127B\u1208\u121D\u1362 \u130D\u1295\u1299\u1290\u1271\u1295 \u12EB\u1228\u130B\u130D\u1321\u1293 \u12A5\u1295\u12F0\u1308\u1293 \u12ED\u121E\u12AD\u1229\u1362",playing:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B \u1260\u1218\u132B\u12C8\u1275 \u120B\u12ED \u1290\u12CD\u1362",playBlocked:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B\u12CD \u12DD\u130D\u1301 \u1290\u12CD\u1362 \u1208\u1218\u1300\u1218\u122D \u12E8\u1218\u130D\u1208\u132B \u12A0\u132B\u12CD\u1275\u1295 \u12ED\u132B\u1291\u1362",paused:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B\u12CD \u12A8\u1275\u121D\u1205\u122D\u1271 \u130B\u122D \u1246\u121F\u120D\u1362",stopped:"\u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B\u12CD \u1246\u121F\u120D\u1362",finished:"\u1218\u130D\u1208\u132B\u12CD \u1270\u1320\u1293\u124B\u120D\u1362",failed:"\u12E8\u1270\u1240\u12F3\u12CD \u1218\u130D\u1208\u132B \u1218\u132B\u12C8\u1275 \u12A0\u120D\u127B\u1208\u121D\u1362",mode:"\u12E8\u1218\u130D\u1208\u132B \u1201\u1294\u1273",recorded:"\u12E8\u1270\u1240\u12F3 \u12F5\u121D\u1345",text:"\u12E8\u133D\u1211\u134D \u1218\u130D\u1208\u132B\u12CE\u127D",play:"\u1218\u130D\u1208\u132B\u12CD\u1295 \u12A0\u132B\u12CD\u1275",stop:"\u12A0\u1241\u121D",extended:"\u12E8\u1270\u122B\u12D8\u1218 \u12E8\u12F5\u121D\u1345 \u1218\u130D\u1208\u132B (\u12E8\u1275\u121D\u1205\u122D\u1271\u1295 \u126A\u12F2\u12EE \u12EB\u1246\u121B\u120D)"}};function E(){let l={enabled:!1,extended:!1,mode:"audio"};try{let e=JSON.parse(localStorage.getItem(c)||"{}")?.ad;return!e||typeof e!="object"||Array.isArray(e)?{value:l,hasExtended:!1}:{value:{enabled:typeof e.enabled=="boolean"?e.enabled:!1,extended:typeof e.extended=="boolean"?e.extended:!1,mode:e.mode==="text"?"text":"audio"},hasExtended:typeof e.extended=="boolean"}}catch{return{value:l,hasExtended:!1}}}var i=class extends y{constructor(){super(...arguments);this.src="";this.textVtt="";this.offsetMs=0;this.api="";this.apiKey="";this.lang="";this.defaultExtended=!1;this.preferences=E().value;this.status=p.en.off;this.cues=[];this.activeText="";this.hasStoredExtended=E().hasExtended;this.wasPlaying=!1;this.pausingForExtended=!1;this.bindPlayer=()=>{this.player=this.closest("savanna-player")??void 0,this.media=this.player?.media};this.handleTimeUpdate=e=>{let t=e.detail;if(!t||!Number.isFinite(t.time)||!this.preferences.enabled)return;if(this.preferences.mode==="text"){let o=this.cues.find(f=>t.time>=f.start&&t.time<f.end);o&&o.text!==this.activeText?(this.activeText=o.text,this.status=o.text):!o&&this.activeText&&(this.activeText="");return}let s=this.audio;if(!s||!this.src||this.extended&&this.wasPlaying&&t.paused)return;let u=Math.max(0,t.time-this.offsetMs/1e3);if(Math.abs(s.currentTime-u)>.45)try{s.currentTime=u}catch{}s.playbackRate=t.rate||1,t.paused?s.pause():s.paused&&s.play().catch(()=>{this.status=this.copy.playBlocked})};this.handleSeek=e=>{let t=e.detail;if(!(typeof t?.time!="number"||!this.audio||this.preferences.mode!=="audio"))try{this.audio.currentTime=Math.max(0,t.time-this.offsetMs/1e3)}catch{}};this.handlePlayerPause=()=>{if(this.pausingForExtended){this.pausingForExtended=!1;return}this.preferences.enabled&&this.preferences.mode==="audio"&&(this.audio?.pause(),this.wasPlaying=!1,this.status=this.copy.paused)};this.handlePlayerPlay=()=>{!this.preferences.enabled||this.preferences.mode!=="audio"||this.extended||(this.bindPlayer(),this.media&&this.syncAudioToPlayer(this.media.currentTime),this.audio?.play().catch(()=>{this.status=this.copy.playBlocked}))};this.handleDescriptionEnded=()=>{let e=this.extended&&this.wasPlaying;this.wasPlaying=!1,this.preferences={...this.preferences,enabled:!1},this.persist(),this.emitState(),e&&this.media?.paused&&this.media.play().catch(()=>{}),this.status=this.copy.finished};this.handleAudioError=()=>{this.status=this.copy.failed,this.dispatchEvent(new CustomEvent("savanna:error",{bubbles:!0,composed:!0,detail:{feature:"audio-description-audio",message:this.status}}))}}get audio(){return this.renderRoot.querySelector("audio")}get copy(){return this.lang.toLowerCase().startsWith("am")?p.am:p.en}get extended(){return this.hasStoredExtended?this.preferences.extended:this.defaultExtended}get isEnabled(){return this.preferences.enabled}connectedCallback(){super.connectedCallback(),this.bindPlayer(),this.player?.addEventListener("savanna:ready",this.bindPlayer),this.player?.addEventListener("savanna:timeupdate",this.handleTimeUpdate),this.player?.addEventListener("savanna:seek",this.handleSeek),this.player?.addEventListener("savanna:pause",this.handlePlayerPause),this.player?.addEventListener("savanna:play",this.handlePlayerPlay)}disconnectedCallback(){this.textLoadController?.abort(),this.player?.removeEventListener("savanna:ready",this.bindPlayer),this.player?.removeEventListener("savanna:timeupdate",this.handleTimeUpdate),this.player?.removeEventListener("savanna:seek",this.handleSeek),this.player?.removeEventListener("savanna:pause",this.handlePlayerPause),this.player?.removeEventListener("savanna:play",this.handlePlayerPlay),this.stop(!1,!1),super.disconnectedCallback()}firstUpdated(){this.bindPlayer(),this.textVtt&&this.loadTextDescriptions()}updated(e){e.has("textVtt")&&this.textVtt&&this.loadTextDescriptions(),e.has("src")&&this.audio?.load()}persist(){try{let e=JSON.parse(localStorage.getItem(c)||"{}"),t=e&&typeof e=="object"&&!Array.isArray(e)?e:{};t.ad=this.preferences,localStorage.setItem(c,JSON.stringify(t))}catch{}}emitState(){this.dispatchEvent(new CustomEvent("savanna:ad-change",{bubbles:!0,composed:!0,detail:{enabled:this.preferences.enabled,mode:this.preferences.mode}}))}async loadTextDescriptions(){if(this.textLoadController?.abort(),!this.textVtt){this.cues=[];return}let e=new AbortController;this.textLoadController=e;try{let t=x({urlPath:this.textVtt,apiBase:this.api}),s=await g({url:t,apiKey:this.apiKey,apiBase:this.api,signal:e.signal});if(e.signal.aborted)return;if(this.cues=v(s.text),this.cues.length===0)throw new Error("No timed descriptions were found.")}catch{if(e.signal.aborted)return;this.cues=[],this.status=this.copy.loadError,this.dispatchEvent(new CustomEvent("savanna:error",{bubbles:!0,composed:!0,detail:{feature:"audio-description-text",message:this.status}}))}}toggle(){this.setEnabled(!this.preferences.enabled)}async setEnabled(e){if(!e){this.stop();return}if(this.preferences.mode==="text"){if(this.cues.length||(this.status=this.copy.loading,await this.loadTextDescriptions()),!this.cues.length){this.status=this.copy.textUnavailable;return}this.preferences={...this.preferences,enabled:!0},this.persist(),this.emitState(),this.status=this.activeText||this.copy.on;return}if(!this.src||!this.audio){this.status=this.copy.unavailable;return}this.bindPlayer(),this.wasPlaying=!!(this.media&&!this.media.paused),this.preferences={...this.preferences,enabled:!0},this.persist(),this.emitState();let t=Math.max(0,(this.media?.currentTime??0)-this.offsetMs/1e3);this.audio.currentTime=t,this.audio.playbackRate=this.media?.playbackRate||1,this.extended&&this.wasPlaying&&this.media&&!this.media.paused&&(this.pausingForExtended=!0,this.media.pause());try{await this.audio.play(),this.status=this.copy.playing}catch{this.status=this.copy.playBlocked}}syncAudioToPlayer(e){if(this.audio){try{this.audio.currentTime=Math.max(0,e-this.offsetMs/1e3)}catch{}this.audio.playbackRate=this.media?.playbackRate||1}}stop(e=!0,t=!0){this.audio?.pause();let s=this.extended&&this.wasPlaying;this.wasPlaying=!1,e&&(this.preferences={...this.preferences,enabled:!1},this.persist(),this.emitState()),s&&this.media?.paused&&this.media.play().catch(()=>{}),t&&(this.status=this.copy.stopped)}changeMode(e){if(this.preferences.mode===e)return;let t=this.preferences.enabled;this.audio?.pause(),this.preferences={...this.preferences,mode:e,enabled:!1},this.persist(),this.emitState(),this.status=e==="text"?this.copy.loading:this.copy.off,e==="text"?this.loadTextDescriptions():t&&this.setEnabled(!0)}changeExtended(e){this.hasStoredExtended=!0,this.preferences={...this.preferences,extended:e},this.persist(),e&&this.preferences.enabled&&this.audio&&!this.audio.paused&&this.media&&!this.media.paused&&(this.wasPlaying=!0,this.pausingForExtended=!0,this.media.pause())}render(){let e=this.copy,t=this.preferences.enabled?n`<span class="ad-badge" role="status"><span aria-hidden="true">🔊</span> AD ON</span>`:n`<span class="ad-badge ad-badge-off" aria-label=${e.off}>AD OFF</span>`;return n`
      <div class="controls" lang=${this.lang||"en"}>
        ${t}
        <button
          type="button"
          aria-pressed=${String(this.preferences.enabled)}
          aria-label=${this.preferences.enabled?e.on:e.off}
          @click=${()=>this.toggle()}
        >
          ${this.preferences.enabled?e.on:e.off}
        </button>
        <label>
          ${e.mode}
          <select .value=${this.preferences.mode} @change=${s=>this.changeMode(s.target.value)}>
            <option value="audio">${e.recorded}</option>
            <option value="text">${e.text}</option>
          </select>
        </label>
        <button type="button" @click=${()=>{this.setEnabled(!0)}}>${e.play}</button>
        <button type="button" @click=${()=>this.stop()}>${e.stop}</button>
        <label>
          <input
            type="checkbox"
            .checked=${this.extended}
            @change=${s=>this.changeExtended(s.target.checked)}
          />
          ${e.extended}
        </label>
      </div>
      ${this.src?n`<audio preload="metadata" src=${this.src} @ended=${this.handleDescriptionEnded} @error=${this.handleAudioError}></audio>`:h}
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${this.status}</p>
      ${this.activeText?n`<p lang=${this.lang||"en"}>${this.activeText}</p>`:h}
    `}};i.styles=b`
    :host {
      display: block;
      color: inherit;
      font: 16px/1.5 system-ui, sans-serif;
    }

    :host([hidden]) {
      display: none !important;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    button,
    select {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid #72548a;
      border-radius: 8px;
      background: #fff;
      color: #241b2b;
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 3px solid #9a5b00;
      outline-offset: 2px;
    }

    .ad-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 3px 10px;
      border-radius: 16px;
      background: #176b2c;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }

    .ad-badge-off {
      background: #4b5563;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (forced-colors: active) {
      :host {
        color: CanvasText;
      }

      button,
      select {
        forced-color-adjust: auto;
        border-color: ButtonText;
        background: ButtonFace;
        color: ButtonText;
      }

      .ad-badge,
      .ad-badge-off {
        border: 1px solid ButtonText;
        background: Canvas;
        color: CanvasText;
      }

      button:focus-visible,
      select:focus-visible,
      input:focus-visible {
        outline-color: Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `,a([r()],i.prototype,"src",2),a([r({type:String,attribute:"text-vtt"})],i.prototype,"textVtt",2),a([r({type:Number,attribute:"offset-ms"})],i.prototype,"offsetMs",2),a([r()],i.prototype,"api",2),a([r({attribute:"api-key"})],i.prototype,"apiKey",2),a([r()],i.prototype,"lang",2),a([r({type:Boolean,attribute:"default-extended"})],i.prototype,"defaultExtended",2),a([d()],i.prototype,"preferences",2),a([d()],i.prototype,"status",2),a([d()],i.prototype,"cues",2),a([d()],i.prototype,"activeText",2),i=a([m("savanna-audio-description")],i);export{i as SavannaAudioDescription};
//# sourceMappingURL=audio-description-EQFHGOAG.js.map
