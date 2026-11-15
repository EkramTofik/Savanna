const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Number of user-perceived characters. Ethiopic syllables count as one each. */
export function glen(s: string): number {
  let n = 0;
  for (const _ of segmenter.segment(s)) n++;
  return n;
}

export function graphemes(s: string): string[] {
  return Array.from(segmenter.segment(s), (x) => x.segment);
}

/** Sentence end: . ! ? ellipsis, Ethiopic full stop and question mark, optionally followed by a closing quote or bracket. */
export const SENTENCE_END = /[.!?…።፧]["'”’)\]]*$/;
/** Clause end: comma, semicolon, colon and their Ethiopic forms. */
export const CLAUSE_END = /[,;:፣፤፥]["'”’)\]]*$/;

/** Share of letters that are Ethiopic vs Latin, used to catch an English file approved as Amharic (and the reverse). */
export function scriptShare(text: string): { ethiopic: number; latin: number } {
  const eth = (text.match(/\p{Script=Ethiopic}/gu) ?? []).length;
  const lat = (text.match(/\p{Script=Latin}/gu) ?? []).length;
  const total = eth + lat;
  return total === 0 ? { ethiopic: 0, latin: 0 } : { ethiopic: eth / total, latin: lat / total };
}

/** Removes WebVTT-style markup such as <i> or <c.yellow>. Captions are plain text. */
export function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}
