/**
 * WebVTT Parser for Savanna Access Kit (Contract C1 / SRS FR-P3).
 * Parses WebVTT (.vtt) files into structured cues with start/end seconds and sanitized text.
 */

export interface VttCue {
  id?: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

/**
 * Converts a WebVTT timestamp (MM:SS.mmm or HH:MM:SS.mmm) to floating-point seconds.
 */
export function parseTimestamp(ts: string): number {
  const [whole, milliseconds, ...extra] = ts.trim().split(".");
  if (!whole || !milliseconds || extra.length || !/^\d{3}$/.test(milliseconds)) return Number.NaN;
  const parts = whole.split(":");
  if (parts.some((part) => !/^\d+$/.test(part))) return Number.NaN;
  const values = parts.map(Number);
  if (values.length === 2) {
    const [minutes, seconds] = values;
    if (minutes === undefined || seconds === undefined || seconds > 59) return Number.NaN;
    return minutes * 60 + seconds + Number(`0.${milliseconds}`);
  }
  if (values.length === 3) {
    const [hours, minutes, seconds] = values;
    if (
      hours === undefined ||
      minutes === undefined ||
      seconds === undefined ||
      minutes > 59 ||
      seconds > 59
    )
      return Number.NaN;
    return hours * 3600 + minutes * 60 + seconds + Number(`0.${milliseconds}`);
  }
  return Number.NaN;
}

/**
 * Strips WebVTT styling/voice markup (<v Name>, <b>, </i>, <c.color>, etc.)
 * while preserving visible text and clean line breaks.
 */
export function sanitizeCueText(raw: string): string {
  return raw
    .replace(/<v(?:\.[^>]+|\s+[^>]+)?>/gi, '') // voice tags
    .replace(/<\/v>/gi, '')
    .replace(/<[^>]+>/g, '') // general html/vtt tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Parses full WebVTT string content into an array of VttCue objects.
 */
export function parseWebVtt(vttContent: string): VttCue[] {
  if (!vttContent || !vttContent.includes('-->')) {
    return [];
  }

  // Normalize line endings
  const normalized = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: VttCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Find the timing line containing "-->"
    const timingIndex = lines.findIndex(l => l.includes('-->'));
    if (timingIndex === -1) continue;

    const timingLine = lines[timingIndex];
    if (!timingLine) continue;
    const [startRaw, ...rest] = timingLine.split('-->');
    if (!startRaw || rest.length === 0) continue;

    const endPart = rest.join('-->').trim().split(/\s+/)[0];
    if (!endPart) continue;
    const startSec = parseTimestamp(startRaw);
    const endSec = parseTimestamp(endPart);

    if (Number.isNaN(startSec) || Number.isNaN(endSec) || endSec <= startSec) {
      continue;
    }

    const id = timingIndex > 0 ? lines[0] : undefined;
    const textLines = lines.slice(timingIndex + 1);
    const rawText = textLines.join('\n');
    const cleanText = sanitizeCueText(rawText);

    if (cleanText.length > 0) {
      cues.push({
        id,
        start: startSec,
        end: endSec,
        text: cleanText,
      });
    }
  }

  // Ensure cues are sorted chronologically
  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Finds the active cue text for a given playback timestamp.
 * If multiple cues overlap, joins them with a newline.
 */
export function getActiveCueText(cues: VttCue[], currentTime: number): string {
  if (!cues || cues.length === 0) return '';
  const active = cues.filter(c => c.start <= currentTime && currentTime <= c.end);
  if (active.length === 0) return '';
  return active.map(c => c.text).join('\n');
}
