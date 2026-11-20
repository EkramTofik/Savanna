export type AudioDescriptionCue = { start: number; end: number; text: string };

/** Convert lesson time to the audio-description track timeline and return its active cue. */
export function activeAudioDescriptionCue(
  cues: AudioDescriptionCue[],
  lessonTime: number,
  offsetMs: number,
): string {
  const trackTime = Math.max(0, lessonTime - Math.max(0, offsetMs) / 1000);
  return cues.find((cue) => trackTime >= cue.start && trackTime < cue.end)?.text ?? "";
}
