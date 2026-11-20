const MAX_LINE = 32;

export function assertL104MediaStreams(videoInfo, audioInfo) {
  if (videoInfo?.codec_name !== "h264") {
    throw new Error("L-104 video must contain H.264 video for the documented player target.");
  }
  if (!audioInfo) {
    throw new Error("L-104 MP4 must include its English narration audio track so the existing video player can play it.");
  }
  if (audioInfo.codec_name !== "aac") {
    throw new Error("L-104 MP4 narration audio must use AAC for the documented player target.");
  }
}

export function extractL104EnglishScript(markdown) {
  const match = markdown.match(/## English narration master script\s*([\s\S]*?)\n\*\*Recording note:/);
  if (!match) throw new Error("Could not find the L-104 English narration master script.");
  const body = match[1]
    .replace(/^### Scene \d+ — .*$/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!body) throw new Error("The L-104 English narration master script is empty.");
  return body;
}

function splitIntoCaptionTexts(text, maxLine = MAX_LINE) {
  const cues = [];
  let lines = [""];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > maxLine) throw new Error(`Caption word exceeds ${maxLine} characters: ${word}`);
    const line = lines.length - 1;
    const candidate = lines[line] ? `${lines[line]} ${word}` : word;
    if (candidate.length <= maxLine) {
      lines[line] = candidate;
      continue;
    }
    if (lines.length === 1) {
      lines.push(word);
      continue;
    }
    cues.push(lines.join("\n"));
    lines = [word];
  }
  if (lines.some(Boolean)) cues.push(lines.join("\n"));
  return cues;
}

export function generateDraftCaptionCues(text, durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 120 || durationSeconds > 180) {
    throw new Error("L-104 duration must be between 120 and 180 seconds.");
  }
  const texts = splitIntoCaptionTexts(text);
  if (!texts.length || texts.length > Math.floor(durationSeconds)) {
    throw new Error("Could not divide the narration into valid timed caption cues.");
  }
  const interval = durationSeconds / texts.length;
  if (interval < 1 || interval > 7) {
    throw new Error("Draft cue timings must each be between 1 and 7 seconds.");
  }
  return texts.map((caption, index) => ({
    start: index * interval,
    end: index === texts.length - 1 ? durationSeconds : (index + 1) * interval,
    text: caption,
  }));
}

export function serializeDraftVtt(cues) {
  const timestamp = (seconds) => {
    const ms = Math.round(seconds * 1000);
    const h = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
    const millis = String(ms % 1000).padStart(3, "0");
    return `${h}:${m}:${s}.${millis}`;
  };
  return [
    "WEBVTT",
    "",
    "NOTE Timing draft, must be checked against the recording. reviewed=false",
    "",
    ...cues.flatMap((cue, index) => [
      String(index + 1),
      `${timestamp(cue.start)} --> ${timestamp(cue.end)}`,
      cue.text,
      "",
    ]),
  ].join("\n");
}

export function lastVttCueEnd(vtt) {
  const matches = [...vtt.matchAll(/^(\d{2,}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2,}:\d{2}:\d{2}\.\d{3})\s*$/gm)];
  if (!matches.length) throw new Error("No valid WebVTT cue timings were found.");
  const parse = (value) => {
    const [hours, minutes, seconds] = value.split(":");
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  };
  return parse(matches.at(-1)[2]);
}

export function assertCaptionCoverage(vtt, durationSeconds) {
  const finalCueEnd = lastVttCueEnd(vtt);
  if (finalCueEnd < durationSeconds * 0.9) {
    throw new Error(`L-104 captions end at ${finalCueEnd.toFixed(3)}s, before 90% of ${durationSeconds}s.`);
  }
  return finalCueEnd;
}
