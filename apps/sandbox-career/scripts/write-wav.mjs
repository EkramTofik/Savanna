import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "../media/jobs");
const fixtures = path.join(here, "../../../contracts/fixtures/v1");
const jobIds = JSON.parse(readFileSync(path.join(fixtures, "jobs.json"), "utf8")).jobs.map((entry) => entry.id);
mkdirSync(outDir, { recursive: true });

function wavTone(seconds = 24, sampleRate = 22050) {
  const samples = Math.floor(seconds * sampleRate);
  const data = Buffer.alloc(samples * 2);
  const toneSamples = Math.floor(sampleRate * 0.25);
  for (let i = 0; i < toneSamples; i += 1) {
    const value = Math.round(Math.sin((i / sampleRate) * 440 * Math.PI * 2) * 6000);
    data.writeInt16LE(value, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Speak with a voice whose language matches `lang` (am/en). Returns false when no
// matching voice is installed, so we never fall back to a wrong-voice read that
// pronounces only the digits (e.g. the salary).
function speak(text, file, lang) {
  if (process.platform !== "win32") return false;
  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq ${JSON.stringify(lang)} } | Select-Object -First 1
if (-not $voice) { Write-Output 'NO_VOICE'; exit 3 }
$synth.SelectVoice($voice.VoiceInfo.Name)
$synth.Rate = -1
$synth.SetOutputToWaveFile(${JSON.stringify(file)})
$synth.Speak(${JSON.stringify(text)})
$synth.Dispose()
Write-Output 'OK'
`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
  return r.status === 0 && String(r.stdout).includes("OK");
}

for (const id of jobIds) {
  const job = JSON.parse(readFileSync(path.join(fixtures, "jobs", `${id}.json`), "utf8"));
  for (const lang of ["en", "am"]) {
    const summary = job.audioSummary[lang];
    const file = path.join(outDir, `${id}-${lang}.wav`);
    if (speak(summary?.transcript ?? "", file, lang)) {
      console.log("Spoken WAV", file);
    } else {
      writeFileSync(file, wavTone(summary?.durationSec ?? 24));
      console.warn(
        `No "${lang}" voice installed: wrote ${summary?.durationSec ?? 24}s placeholder for ${id}-${lang}. The full transcript stays on the card.`,
      );
    }
  }
}
