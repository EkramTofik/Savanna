/**
 * Braille Formatter & Translator for <savanna-player> (SRS FR-S1, Task 1.8).
 *
 * Implements:
 * - English Grade 1 ASCII Braille translation
 * - Amharic (Ethiopic) Braille translation based on Liblouis `ethio-g1.ctb` table
 * - Strict BRF geometry: 40 cells (columns) wide by 25 lines tall per page
 * - Form feed (\x0c) page transitions
 * - Mandatory header notice: [DRAFT - PENDING BRAILLE READER REVIEW]
 */

import type { TranscriptLine } from './transcript-manager.js';

export const BRF_LINE_WIDTH = 40;
export const BRF_PAGE_HEIGHT = 25;
export const FORM_FEED = '\x0c';

/**
 * Standard ASCII Braille mapping for English alphanumeric characters and punctuation.
 * Maps ASCII characters to North American ASCII Braille code representations.
 */
const EN_BRAILLE_MAP: Record<string, string> = {
  a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h', i: 'i', j: 'j',
  k: 'k', l: 'l', m: 'm', n: 'n', o: 'o', p: 'p', q: 'q', r: 'r', s: 's', t: 't',
  u: 'u', v: 'v', w: 'w', x: 'x', y: 'y', z: 'z',
  ',': '1',
  ';': '2',
  ':': '3',
  '.': '4',
  '!': '6',
  '(': '7',
  ')': '7',
  '?': '8',
  '"': '8',
  "'": "'",
  '-': '-',
  '/': '/',
  ' ': ' ',
};

/**
 * Braille digits (preceded by number sign '#' in ASCII Braille).
 */
const BRAILLE_DIGITS: Record<string, string> = {
  '1': 'a',
  '2': 'b',
  '3': 'c',
  '4': 'd',
  '5': 'e',
  '6': 'f',
  '7': 'g',
  '8': 'h',
  '9': 'i',
  '0': 'j',
};

/**
 * Ethiopic Braille mapping based on Liblouis `ethio-g1.ctb` (UNESCO World Braille standard).
 * Maps Fidel syllables directly to 6-dot ASCII Braille cell patterns.
 */
const ETHIOPIC_BRAILLE_MAP: Record<string, string> = {
  // ሀ (ha) orders
  'ሀ': 'h', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
  // ለ (la) orders
  'ለ': 'l', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo',
  // ሐ (hha) orders
  'ሐ': 'h', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho',
  // መ (ma) orders
  'መ': 'm', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo',
  // ሠ (sza) orders
  'ሠ': 's', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so',
  // ረ (ra) orders
  'ረ': 'r', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro',
  // ሰ (sa) orders
  'ሰ': 's', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so',
  // ሸ (sha) orders
  'ሸ': 'sh', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho',
  // ቀ (qa) orders
  'ቀ': 'q', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qe', 'ቅ': 'q', 'ቆ': 'qo',
  // በ (ba) orders
  'በ': 'b', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo',
  // ተ (ta) orders
  'ተ': 't', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to',
  // ቸ (cha) orders
  'ቸ': 'ch', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho',
  // ኀ (xha) orders
  'ኀ': 'h', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
  // ነ (na) orders
  'ነ': 'n', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no',
  // ኘ (nya) orders
  'ኘ': 'gn', 'ኙ': 'gnu', 'ኚ': 'gni', 'ኛ': 'gna', 'ኜ': 'gne', 'ኝ': 'gn', 'ኞ': 'gno',
  // አ (a) orders
  'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'y', 'ኦ': 'o',
  // ከ (ka) orders
  'ከ': 'k', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
  // ኸ (hxa) orders
  'ኸ': 'k', 'ኹ': 'ku', 'ኺ': 'ki', 'ኻ': 'ka', 'ኼ': 'ke', 'ኽ': 'k', 'ኾ': 'ko',
  // ወ (wa) orders
  'ወ': 'w', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo',
  // ዐ (ain) orders
  'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'y', 'ዖ': 'o',
  // ዘ (za) orders
  'ዘ': 'z', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo',
  // ዠ (zha) orders
  'ዠ': 'zh', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhe', 'ዥ': 'zh', 'ዦ': 'zho',
  // የ (ya) orders
  'የ': 'y', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y', 'ዮ': 'yo',
  // ደ (da) orders
  'ደ': 'd', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do',
  // ጀ (ja) orders
  'ጀ': 'j', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo',
  // ገ (ga) orders
  'ገ': 'g', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go',
  // ጠ (t'a) orders
  'ጠ': 't', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to',
  // ጨ (ch'a) orders
  'ጨ': 'ch', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho',
  // ጰ (p'a) orders
  'ጰ': 'p', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po',
  // ጸ (ts'a) orders
  'ጸ': 'ts', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso',
  // ፀ (tz'a) orders
  'ፀ': 'ts', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso',
  // ፈ (fa) orders
  'ፈ': 'f', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo',
  // ፐ (pa) orders
  'ፐ': 'p', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po',
  // Labialized variants
  'ሏ': 'lwa', 'ሟ': 'mwa', 'ሯ': 'rwa', 'ሷ': 'swa', 'ሿ': 'shwa', 'ቋ': 'qwa',
  'ቧ': 'bwa', 'ቷ': 'twa', 'ቿ': 'chwa', 'ኋ': 'hwa', 'ኗ': 'nwa', 'ኟ': 'gnwa',
  'ኳ': 'kwa', 'ዟ': 'zwa', 'ዧ': 'zhwa', 'ዷ': 'dwa', 'ጇ': 'jwa', 'ጓ': 'gwa',
  'ጧ': 'twa', 'ጯ': 'chwa', 'ጷ': 'pwa', 'ጿ': 'tswa', 'ፏ': 'fwa',
  // Ethiopic punctuation
  '፡': ' ',   // word separator -> space
  '።': '4',   // full stop -> ASCII Braille 4
  '፣': '1',   // comma -> ASCII Braille 1
  '፤': '2',   // semicolon -> ASCII Braille 2
  '፥': '3',   // colon -> ASCII Braille 3
  '፦': '3-',  // preface colon
  '፧': '8',   // question mark
  '፨': '-',   // section mark
  // Ethiopic digits
  '፩': '#a', '፪': '#b', '፫': '#c', '፬': '#d', '፭': '#e',
  '፮': '#f', '፯': '#g', '፰': '#h', '፱': '#i', '፲': '#aj',
};

/**
 * Translates English prose into Grade 1 ASCII Braille.
 */
export function translateEnglishToBraille(text: string): string {
  let result = '';
  let inNumber = false;

  for (const ch of text) {
    // Numbers: precede first digit with '#'
    if (/[0-9]/.test(ch)) {
      if (!inNumber) {
        result += '#';
        inNumber = true;
      }
      result += BRAILLE_DIGITS[ch] ?? ch;
      continue;
    }

    inNumber = false;

    // Uppercase letters: precede with capital sign ',' in Grade 1
    if (/[A-Z]/.test(ch)) {
      result += ',' + ch.toLowerCase();
      continue;
    }

    // Lowercase and standard characters
    const mapped = EN_BRAILLE_MAP[ch];
    if (mapped) {
      result += mapped;
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Translates Amharic prose into Ethiopic ASCII Braille based on ethio-g1.ctb.
 */
export function translateAmharicToBraille(text: string): string {
  let result = '';

  for (const ch of text) {
    const etMapped = ETHIOPIC_BRAILLE_MAP[ch];
    if (etMapped) {
      result += etMapped;
    } else if (/[0-9]/.test(ch)) {
      result += '#' + (BRAILLE_DIGITS[ch] ?? ch);
    } else {
      const enMapped = EN_BRAILLE_MAP[ch.toLowerCase()];
      if (enMapped) {
        result += enMapped;
      } else {
        result += ch;
      }
    }
  }

  return result;
}

/**
 * Wraps a line of Braille text so that no line exceeds `maxWidth` cells.
 * Performs clean word-wrapping at whitespace where possible.
 */
export function wrapBrailleLine(line: string, maxWidth = BRF_LINE_WIDTH): string[] {
  if (!line || line.length === 0) return [''];
  if (line.length <= maxWidth) return [line];

  const words = line.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      if (word.length <= maxWidth) {
        current = word;
      } else {
        // Break extremely long single token
        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth));
        }
      }
    } else {
      if (current.length + 1 + word.length <= maxWidth) {
        current += ' ' + word;
      } else {
        lines.push(current);
        if (word.length <= maxWidth) {
          current = word;
        } else {
          for (let i = 0; i < word.length; i += maxWidth) {
            const chunk = word.slice(i, i + maxWidth);
            if (i + maxWidth < word.length) {
              lines.push(chunk);
            } else {
              current = chunk;
            }
          }
        }
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

/**
 * Paginates an array of wrapped lines into strict 25 lines per page,
 * joining pages with Form Feed (\x0c\r\n).
 */
export function paginateBrailleLines(
  lines: string[],
  pageHeight = BRF_PAGE_HEIGHT
): string {
  const pages: string[][] = [];
  let currentPage: string[] = [];

  for (const line of lines) {
    currentPage.push(line.slice(0, BRF_LINE_WIDTH));
    if (currentPage.length === pageHeight) {
      pages.push(currentPage);
      currentPage = [];
    }
  }

  if (currentPage.length > 0) {
    // Pad page to 25 lines if needed or keep last page tidy
    while (currentPage.length < pageHeight) {
      currentPage.push('');
    }
    pages.push(currentPage);
  }

  return pages
    .map((pageLines) => pageLines.join('\r\n'))
    .join(`${FORM_FEED}\r\n`);
}

/**
 * Formats transcript lines and plain-language summary into a standard
 * 40 cells x 25 lines BRF document with mandatory draft watermark notice (SRS FR-S1).
 */
export function formatTranscriptToBrf(
  lessonTitle: string,
  lang: string,
  summary: string,
  lines: TranscriptLine[],
  formatTimeFn: (sec: number) => string = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
): string {
  const isAmharic = lang === 'am';
  const translator = isAmharic ? translateAmharicToBraille : translateEnglishToBraille;

  const rawDocumentLines: string[] = [];

  // Mandatory Header per SRS FR-S1 & Delegation Plan Task 1.8
  rawDocumentLines.push('========================================');
  rawDocumentLines.push('[DRAFT - PENDING BRAILLE READER REVIEW]');
  rawDocumentLines.push('========================================');
  rawDocumentLines.push('');
  rawDocumentLines.push(
    `SAVANNA ACCESS KIT - BRF TRANSCRIPT`
  );
  const displayTitle = isAmharic
    ? translator(lessonTitle || 'Lesson')
    : (lessonTitle || 'Lesson');
  rawDocumentLines.push(
    `LESSON: ${displayTitle.toUpperCase()} (${isAmharic ? 'AMHARIC' : 'ENGLISH'})`
  );
  rawDocumentLines.push('----------------------------------------');
  rawDocumentLines.push('');

  // Plain-Language Summary Header
  if (summary && summary.trim().length > 0) {
    rawDocumentLines.push(isAmharic ? 'SUMMARY4' : 'SUMMARY:');
    const translatedSummary = translator(summary.trim());
    rawDocumentLines.push(translatedSummary);
    rawDocumentLines.push('----------------------------------------');
    rawDocumentLines.push('');
  }

  rawDocumentLines.push(isAmharic ? 'TIMED TRANSCRIPT4' : 'TIMED TRANSCRIPT:');
  rawDocumentLines.push('');

  // Timed Cue Lines
  for (const line of lines) {
    const timeStr = `[${formatTimeFn(line.start)}] `;
    const brailleText = translator(line.text);
    rawDocumentLines.push(`${timeStr}${brailleText}`);
  }

  // Wrap every document line to 40 characters maximum
  const wrappedLines: string[] = [];
  for (const rawLine of rawDocumentLines) {
    const wrapped = wrapBrailleLine(rawLine, BRF_LINE_WIDTH);
    wrappedLines.push(...wrapped);
  }

  // Paginate into strict 25 lines per page with form feeds
  return paginateBrailleLines(wrappedLines, BRF_PAGE_HEIGHT);
}
