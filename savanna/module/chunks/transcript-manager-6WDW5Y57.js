import"./chunk-INEEODZZ.js";function g(t,e){if(!t||t.length===0)return[];let r=e.trim().toLowerCase();if(!r)return t.map((n,i)=>({line:n,originalIndex:i}));let a=[];for(let n=0;n<t.length;n++){let i=t[n];i&&i.text.toLowerCase().includes(r)&&a.push({line:i,originalIndex:n})}return a}function l(t,e){return!t||t.length===0||!Number.isFinite(e)?-1:t.findIndex(r=>e>=r.start&&e<r.end)}function f(t,e){if(!t)return[];let r=e.trim();if(!r)return[{text:t,isMatch:!1}];let a=r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),n=new RegExp(`(${a})`,"gi");return t.split(n).filter(o=>o.length>0).map(o=>({text:o,isMatch:o.toLowerCase()===r.toLowerCase()}))}function u(t,e,r,a,n){let i="=".repeat(60),s=`${t||"Lesson"} - Transcript (${e==="am"?"Amharic (\u12A0\u121B\u122D\u129B)":"English"})
`;s+=`${i}

`,r&&r.trim().length>0&&(s+=`PLAIN-LANGUAGE SUMMARY:
`,s+=`${r.trim()}

`,s+=`${"-".repeat(60)}

`),s+=`TIMED TRANSCRIPT:

`;for(let c of a){let p=n(c.start);s+=`[${p}] ${c.text}
`}return s}export{g as filterTranscriptLines,l as findActiveTranscriptLineIndex,u as formatTranscriptForDownload,f as splitTextByMatch};
//# sourceMappingURL=transcript-manager-6WDW5Y57.js.map
