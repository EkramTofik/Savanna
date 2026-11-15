import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "../media/jobs");
const fixtures = path.join(here, "../../../contracts/fixtures/v1");
const jobIds = JSON.parse(await readFile(path.join(fixtures, "jobs.json"), "utf8")).jobs.map(
  (entry) => entry.id,
);

// Azure Speech neural voices. Amharic is not shipped by Windows SAPI, so this is
// the only route that produces a real Amharic read of the summaries.
const VOICES = {
  en: { name: "en-US-AriaNeural", locale: "en-US" },
  am: { name: "am-ET-MekdesNeural", locale: "am-ET" },
};

const key = process.env.AZURE_SPEECH_KEY;
const region = process.env.AZURE_SPEECH_REGION;

if (!key || !region) {
  console.error(
    "AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not set, so no audio was generated.\n" +
      "Existing WAVs were left untouched (the card still shows the full transcript).\n" +
      "Set both and re-run, e.g.:\n" +
      "  AZURE_SPEECH_KEY=xxx AZURE_SPEECH_REGION=eastus node scripts/render-audio-azure.mjs",
  );
  process.exit(1);
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ssml(text, { name, locale }) {
  return `<speak version='1.0' xml:lang='${locale}'><voice name='${name}'>${escapeXml(text)}</voice></speak>`;
}

const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

await mkdir(outDir, { recursive: true });

let failed = false;

for (const id of jobIds) {
  const job = JSON.parse(await readFile(path.join(fixtures, "jobs", `${id}.json`), "utf8"));
  for (const lang of ["en", "am"]) {
    const transcript = job.audioSummary?.[lang]?.transcript ?? "";
    if (!transcript) {
      console.warn(`No "${lang}" transcript for ${id}: skipped.`);
      continue;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "riff-22050hz-16bit-mono-pcm",
        "User-Agent": "savanna-access-kit",
      },
      body: ssml(transcript, VOICES[lang]),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error(`Azure ${res.status} for ${id}-${lang}: ${detail}`);
      failed = true;
      continue;
    }

    const audio = Buffer.from(await res.arrayBuffer());
    if (audio.subarray(0, 4).toString("ascii") !== "RIFF") {
      console.error(
        `Azure returned ${audio.length} bytes that are not a WAV for ${id}-${lang}: skipped.`,
      );
      failed = true;
      continue;
    }

    const file = path.join(outDir, `${id}-${lang}.wav`);
    await writeFile(file, audio);
    console.log(`Wrote ${file} (${audio.length} bytes, ${VOICES[lang].name})`);
  }
}

process.exit(failed ? 1 : 0);
