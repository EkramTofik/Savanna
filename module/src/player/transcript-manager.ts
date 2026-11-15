/**
 * Transcript Manager & Utilities for <savanna-player> (SRS FR-P8, MoSCoW Must, 2 pts).
 *
 * Provides:
 * - Line search filtering
 * - Active cue index resolution against playback time
 * - Substring match tokenization for accessible <mark> highlighting
 * - Plain-text transcript formatting for accessible client-side download
 */

export interface TranscriptLine {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  id?: string;
  lang?: string;
  lines: TranscriptLine[];
  summary?: string;
}

export interface FilteredTranscriptItem {
  line: TranscriptLine;
  originalIndex: number;
}

export interface TextMatchPart {
  text: string;
  isMatch: boolean;
}

/**
 * Filters transcript lines against a search query (case-insensitive substring match).
 * Preserves the original array index so seeking activates the correct cue.
 */
export function filterTranscriptLines(
  lines: TranscriptLine[],
  query: string
): FilteredTranscriptItem[] {
  if (!lines || lines.length === 0) return [];
  const q = query.trim().toLowerCase();
  if (!q) {
    return lines.map((line, originalIndex) => ({ line, originalIndex }));
  }

  const results: FilteredTranscriptItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.text.toLowerCase().includes(q)) {
      results.push({ line, originalIndex: i });
    }
  }
  return results;
}

/**
 * Finds the index of the line active at the specified currentTime.
 * Returns -1 if no line matches.
 */
export function findActiveTranscriptLineIndex(
  lines: TranscriptLine[],
  currentTime: number
): number {
  if (!lines || lines.length === 0 || !Number.isFinite(currentTime)) return -1;
  return lines.findIndex(
    (line) => currentTime >= line.start && currentTime < line.end
  );
}

/**
 * Tokenizes text into match and non-match segments for accessible <mark> highlighting.
 * Safely escapes special regex characters.
 */
export function splitTextByMatch(
  text: string,
  query: string
): TextMatchPart[] {
  if (!text) return [];
  const q = query.trim();
  if (!q) {
    return [{ text, isMatch: false }];
  }

  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === q.toLowerCase(),
    }));
}

/**
 * Formats transcript lines and plain-language summary into an accessible
 * text document suitable for offline saving and screen reader review (SRS FR-P8).
 */
export function formatTranscriptForDownload(
  lessonTitle: string,
  lang: string,
  summary: string,
  lines: TranscriptLine[],
  formatTimeFn: (sec: number) => string
): string {
  const headerLine = '='.repeat(60);
  const langLabel = lang === 'am' ? 'Amharic (አማርኛ)' : 'English';
  let out = `${lessonTitle || 'Lesson'} - Transcript (${langLabel})\n`;
  out += `${headerLine}\n\n`;

  if (summary && summary.trim().length > 0) {
    out += `PLAIN-LANGUAGE SUMMARY:\n`;
    out += `${summary.trim()}\n\n`;
    out += `${'-'.repeat(60)}\n\n`;
  }

  out += `TIMED TRANSCRIPT:\n\n`;
  for (const line of lines) {
    const timeFormatted = formatTimeFn(line.start);
    out += `[${timeFormatted}] ${line.text}\n`;
  }

  return out;
}
