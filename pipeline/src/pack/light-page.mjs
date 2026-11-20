const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

export function createLightLessonHtml({ title, cuesEn, cuesAm }) {
  for (const [lang, cues] of [["en", cuesEn], ["am", cuesAm]]) {
    if (!Array.isArray(cues) || cues.length === 0) throw new Error(`Missing ${lang} timed transcript cues.`);
  }
  const safeTitle = escapeHtml(title);
  const tracks = JSON.stringify({ en: cuesEn, am: cuesAm }).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title>
<style>
body{max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 system-ui,sans-serif;color:#172033}audio{width:100%;margin-block:1rem}button,select{font:inherit;min-height:44px}button:focus-visible,select:focus-visible{outline:3px solid #005fcc;outline-offset:3px}ol{padding-inline-start:2.5rem;max-height:45vh;overflow:auto}li{padding:.25rem}.active{background:#fff0a8}li button{border:0;background:transparent;text-align:start;width:100%;padding:.25rem}
</style></head>
<body><main><h1>${safeTitle}</h1>
<label for="language">Transcript language</label> <select id="language"><option value="en">English</option><option value="am">Amharic</option></select>
<audio id="lesson-audio" controls preload="metadata" src="lesson-audio.opus"><a href="lesson-audio.opus">Download lesson audio</a></audio>
<p id="sync-status" role="status" aria-live="polite"></p><ol id="transcript" aria-label="Synchronized lesson transcript" lang="en"></ol>
</main>
<script>
const tracks=${tracks};const audio=document.querySelector('#lesson-audio');const list=document.querySelector('#transcript');const language=document.querySelector('#language');let active=-1;
function render(lang){list.replaceChildren();list.lang=lang;list.setAttribute('aria-label',lang==='am'?'የተመሳሰለ የትምህርት ግልባጭ':'Synchronized lesson transcript');for(const [index,cue] of tracks[lang].entries()){const item=document.createElement('li');const button=document.createElement('button');button.type='button';button.textContent=cue.text;button.addEventListener('click',()=>{audio.currentTime=cue.start;audio.focus()});item.append(button);list.append(item)}active=-1;sync()}
function sync(){const cues=tracks[language.value];const index=cues.findIndex(cue=>audio.currentTime>=cue.start&&audio.currentTime<cue.end);if(index===active)return;active=index;for(const [i,item] of [...list.children].entries()){item.classList.toggle('active',i===index);if(i===index){item.setAttribute('aria-current','true');item.scrollIntoView({block:'nearest'})}else item.removeAttribute('aria-current')}}
language.addEventListener('change',()=>render(language.value));audio.addEventListener('timeupdate',sync);render('en');
</script></body></html>`;
}
