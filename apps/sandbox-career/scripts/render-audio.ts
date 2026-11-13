import { spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "../media/jobs");
const fixtures = path.join(here, "../../../contracts/fixtures/v1");
const jobIds: string[] = JSON.parse(await readFile(path.join(fixtures, "jobs.json"), "utf8")).jobs.map(
  (entry: { id: string }) => entry.id,
);

type Job = {
  id: string;
  audioSummary: Record<string, { transcript: string; durationSec?: number }>;
};

function wavSilence(seconds: number, sampleRate = 22050): Buffer {
  const samples = Math.floor(seconds * sampleRate);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < Math.min(samples, sampleRate * 0.2); i += 1) {
    const value = Math.round(Math.sin((i / sampleRate) * 880 * Math.PI * 2) * 4000);
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

// Speak with a voice whose language matches `lang`. Returns false when none is
// installed, so we never ship a wrong-voice read that pronounces only the digits.
function speakWindows(text: string, file: string, lang: string): boolean {
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
  const result = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
  return result.status === 0 && String(result.stdout).includes("OK");
}

const jobs: Job[] = [];
for (const id of jobIds) {
  jobs.push(JSON.parse(await readFile(path.join(fixtures, "jobs", `${id}.json`), "utf8")));
}

await mkdir(outDir, { recursive: true });

for (const job of jobs) {
  for (const lang of ["en", "am"] as const) {
    const file = path.join(outDir, `${job.id}-${lang}.wav`);
    const summary = job.audioSummary[lang];
    const text = summary?.transcript ?? "";
    const ok = process.platform === "win32" && speakWindows(text, file, lang);
    if (!ok) {
      await writeFile(file, wavSilence(summary?.durationSec ?? 24));
      console.warn(
        `No "${lang}" voice installed: wrote placeholder WAV for ${job.id} ${lang}. The full transcript stays in the job fixture.`,
      );
    } else {
      console.log(`Wrote spoken WAV ${file}`);
    }
  }
}
