import{a as f}from"./chunk-UFQ6XX3Z.js";import{a as p,b as n,e as u,f as c,g as d,h as o}from"./chunk-2MOXT47L.js";import{a as s}from"./chunk-INEEODZZ.js";function m(l,h,t){let e=Math.max(0,h-Math.max(0,t)/1e3);return l.find(i=>e>=i.start&&e<i.end)?.text??""}var r="savanna.prefs.v1";function x(){try{return{enabled:!1,extended:!1,mode:"audio",...JSON.parse(localStorage.getItem(r)||"{}").ad}}catch{return{enabled:!1,extended:!1,mode:"audio"}}}var a=class extends u{constructor(){super(...arguments);this.src="";this.textVtt="";this.offsetMs=0;this.p=x();this.status="Audio description is off.";this.cues=[];this.active="";this.wasPlaying=!1;this.validationGeneration=0;this.time=t=>{let e=t.detail;if(e){if(this.p.enabled&&this.p.mode==="text"){let i=m(this.cues,e.time,this.offsetMs);i!==this.active&&(this.active=i,this.status=i||"No audio description at this point.")}if(this.p.enabled&&this.p.mode==="audio"&&this.audio&&this.src){let i=Math.max(0,e.time-this.offsetMs/1e3);if(Math.abs(this.audio.currentTime-i)>.45)try{this.audio.currentTime=i}catch{}this.audio.playbackRate=e.rate||1,e.paused?this.audio.pause():this.audio.paused&&this.audio.play().catch(()=>{})}}};this.descriptionEnded=()=>{this.p.extended&&this.wasPlaying&&this.media?.play().catch(()=>{}),this.wasPlaying=!1,this.p={...this.p,enabled:!1},this.save(),this.notifyAvailability(this.cues.length>0&&!!this.src),this.status="Description finished."};this.audioError=()=>{this.validationGeneration+=1,this.audio?.pause(),this.p.extended&&this.wasPlaying&&this.media?.play().catch(()=>{}),this.wasPlaying=!1,this.p={...this.p,enabled:!1},this.save(),this.status="Recorded description failed to load.",this.notifyAvailability(!1)}}connectedCallback(){super.connectedCallback(),this.player=this.closest("savanna-player"),this.media=this.player?.media,this.player?.addEventListener("savanna:timeupdate",this.time)}disconnectedCallback(){this.player?.removeEventListener("savanna:timeupdate",this.time),this.stop(!1),super.disconnectedCallback()}firstUpdated(){this.audio=this.renderRoot.querySelector("audio")||void 0,this.media||(this.player=this.closest("savanna-player"),this.media=this.player?.media)}updated(t){(t.has("src")||t.has("textVtt")||t.has("offsetMs"))&&this.validateTrack()}save(){try{let t=JSON.parse(localStorage.getItem(r)||"{}");t.ad=this.p,localStorage.setItem(r,JSON.stringify(t))}catch{}}async validateTrack(){let t=++this.validationGeneration;if(this.notifyAvailability(!1),this.cues=[],this.active="",!this.src.trim()||!this.textVtt.trim()||!Number.isSafeInteger(this.offsetMs)||this.offsetMs<0)return this.status="Recorded audio description is not available.",!1;try{let e=await fetch(this.textVtt);if(!e.ok)throw Error();let i=f(await e.text()).map(({start:b,end:y,text:v})=>({start:b,end:y,text:v}));if(t!==this.validationGeneration)return!1;if(!i.length)throw Error("No valid audio-description cues");return this.cues=i,this.status="Audio-description timings are ready.",this.notifyAvailability(!0),!0}catch{return t!==this.validationGeneration||(this.cues=[],this.status="Audio-description timings could not be loaded.",this.notifyAvailability(!1)),!1}}notifyAvailability(t){this.dispatchEvent(new CustomEvent("savanna:ad-availability",{bubbles:!0,composed:!0,detail:{available:t,enabled:this.p.enabled}}))}toggle(){this.p.enabled?this.stop():this.play()}async play(){if(this.p={...this.p,enabled:!0},this.save(),this.notifyAvailability(!0),this.p.mode==="text"){this.status=this.active||"Text descriptions are enabled.";return}if(!this.src||!this.audio){this.status="Recorded audio description is not available.",this.notifyAvailability(!1);return}if(this.media){this.wasPlaying=!this.media.paused;try{this.audio.currentTime=Math.max(0,this.media.currentTime-this.offsetMs/1e3)}catch{}this.audio.playbackRate=this.media.playbackRate}try{await this.audio.play(),this.status="Audio description playing."}catch{this.status="Press Play to start the description."}}stop(t=!0){this.audio?.pause(),this.p.extended&&this.wasPlaying&&this.media?.play().catch(()=>{}),this.wasPlaying=!1,t&&(this.p={...this.p,enabled:!1},this.save(),this.notifyAvailability(this.cues.length>0&&!!this.src)),this.status="Audio description stopped."}extended(t){this.p={...this.p,extended:t},this.save(),t&&this.audio&&!this.audio.paused&&(this.wasPlaying=!!this.media&&!this.media.paused,this.media?.pause())}render(){let t=this.p.enabled?n`<span class="ad-badge" role="status" aria-label="Audio description active"
          >🔊 AD ON</span
        >`:n`<span class="ad-badge ad-badge-off" aria-label="Audio description off">AD OFF</span>`;return n`<div class="controls">
        ${t}<button
          type="button"
          aria-pressed=${String(this.p.enabled)}
          aria-label="Audio description ${this.p.enabled?"on":"off"}"
          @click=${()=>this.p.enabled?this.stop():void this.play()}
        >
          Audio description: ${this.p.enabled?"On":"Off"}</button
        ><label
          >Mode
          <select
            .value=${this.p.mode}
            @change=${e=>{this.p={...this.p,mode:e.target.value},this.save()}}
          >
            <option value="audio">Recorded audio</option>
            <option value="text">Text descriptions</option>
          </select></label
        ><button @click=${this.play}>Play description</button
        ><button @click=${this.stop}>Stop</button
        ><label
          ><input
            type="checkbox"
            .checked=${this.p.extended}
            @change=${e=>this.extended(e.target.checked)}
          />
          Extended AD (pause lesson)</label
        >
      </div>
      <audio
        preload="metadata"
        .src=${this.src}
        @play=${()=>{this.p.extended&&(this.wasPlaying=!!this.media&&!this.media.paused,this.media?.pause())}}
        @ended=${this.descriptionEnded}
        @error=${this.audioError}
      ></audio>
      <p role="status" aria-live="polite">${this.status}</p>`}};a.styles=p`
    :host([hidden]) {
      display: none !important;
    }
    :host {
      display: block;
      font: 16px/1.5 system-ui;
      color: inherit;
    }
    button,
    select {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid #72548a;
      border-radius: 8px;
      background: white;
      color: #241b2b;
      font: inherit;
    }
    button:focus-visible,
    select:focus-visible {
      outline: 3px solid #e09b00;
      outline-offset: 2px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .ad-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 16px;
      background: #4caf50;
      color: white;
      font-size: 13px;
      font-weight: 700;
      animation: fadeIn 0.3s;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    .ad-badge-off {
      background: #666;
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
  `,s([d()],a.prototype,"src",2),s([d({attribute:"text-vtt"})],a.prototype,"textVtt",2),s([d({type:Number,attribute:"offset-ms"})],a.prototype,"offsetMs",2),s([o()],a.prototype,"p",2),s([o()],a.prototype,"status",2),s([o()],a.prototype,"cues",2),s([o()],a.prototype,"active",2),a=s([c("savanna-audio-description")],a);export{a as SavannaAudioDescription};
//# sourceMappingURL=audio-description-JK7NTCSP.js.map
