import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "../media/jobs");
const fixtures = path.join(here, "../../../contracts/fixtures/v1");
const availableJobIds = JSON.parse(
  await readFile(path.join(fixtures, "jobs.json"), "utf8"),
).jobs.map((entry) => entry.id);
const requestedJob = process.argv[2];
if (requestedJob && !availableJobIds.includes(requestedJob)) {
  throw new Error(
    `Unknown job id "${requestedJob}". Available jobs: ${availableJobIds.join(", ")}`,
  );
}
const jobIds = requestedJob ? [requestedJob] : availableJobIds;

// Google Translate TTS is the only Amharic voice reachable without an account:
// Windows ships no am-ET engine (SAPI and OneCore both list en-US only), and the
// Azure route needs a key. It caps `q` at roughly 200 characters and returns MP3,
// so long summaries are split on sentence boundaries and the frames concatenated.
const LANG = "am";
const MAX_CHARS = 150;
const SENTENCE_END = ["።", "፧", "፤", "!", "?", ".", "፣"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunk(text, max = MAX_CHARS) {
  const parts = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = -1;
    for (const mark of SENTENCE_END) {
      const at = rest.lastIndexOf(mark, max);
      if (at > cut) cut = at;
    }
    // No sentence break near the limit: fall back to the last word boundary.
    if (cut < max * 0.5) {
      const space = rest.lastIndexOf(" ", max);
      cut = space > max * 0.5 ? space : max - 1;
    }
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

async function say(text) {
  const url =
    "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" +
    LANG +
    "&q=" +
    encodeURIComponent(text);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://translate.google.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const audio = Buffer.from(await res.arrayBuffer());
  // MP3 frames start with 0xFF (or an "ID3" tag). Anything else is an error page.
  const isMp3 = audio.subarray(0, 3).toString("latin1") === "ID3" || audio[0] === 0xff;
  if (!isMp3) throw new Error(`response was not MP3 (${audio.length} bytes)`);
  return audio;
}

await mkdir(outDir, { recursive: true });

let failed = false;

for (const id of jobIds) {
  const job = JSON.parse(await readFile(path.join(fixtures, "jobs", `${id}.json`), "utf8"));
  const transcript = job.audioSummary?.[LANG]?.transcript ?? "";
  if (!transcript) {
    console.warn(`No "${LANG}" transcript for ${id}: skipped.`);
    continue;
  }

  const pieces = chunk(transcript);
  const frames = [];
  try {
    for (const [index, piece] of pieces.entries()) {
      frames.push(await say(piece));
      console.log(
        `  ${id}-${LANG}: chunk ${index + 1}/${pieces.length} (${piece.length} chars, ${frames.at(-1).length} bytes)`,
      );
      if (index < pieces.length - 1) await sleep(400);
    }
  } catch (error) {
    console.error(
      `${id}-${LANG}: failed at chunk ${frames.length + 1}/${pieces.length} - ${error.message}`,
    );
    failed = true;
    continue;
  }

  const file = path.join(outDir, `${id}-${LANG}.mp3`);
  const audio = Buffer.concat(frames);
  await writeFile(file, audio);
  console.log(`Wrote ${file} (${audio.length} bytes, ${pieces.length} chunks, ${LANG})`);
}

process.exit(failed ? 1 : 0);
