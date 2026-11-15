// Stands in for a real ASR engine in tests: writes segment JSON (our layout) to --out.
import fs from "node:fs";

const get = (flag) => process.argv[process.argv.indexOf(flag) + 1];
const lang = get("--lang");
const out = get("--out");

const say = {
  en: [
    "Welcome to this lesson about how clean water reaches a village.",
    "First we look at the river, then the pump, and last the storage tank.",
    "Remember to keep the tank covered.",
  ],
  am: ["ዛሬ ስለ ውሃ እንማራለን።", "ውሃ ለሕይወት አስፈላጊ ነው።"],
}[lang];

let t = 0.2;
const segments = say.map((text) => {
  const words = text.split(" ").map((w, i, all) => ({ text: w, start: t + i * 0.35, end: t + (i + 1) * 0.35 }));
  const seg = { start: t, end: t + words.length * 0.35, text, words };
  t = seg.end + 0.3;
  return seg;
});
fs.writeFileSync(out, JSON.stringify({ segments }));
