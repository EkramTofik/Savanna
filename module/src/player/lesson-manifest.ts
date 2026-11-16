export interface LessonTrack {
  url: string;
  offsetMs?: number;
}

export interface LessonManifest {
  id: string;
  title: { en: string; am: string };
  durationSec: number;
  media: { video: string; audio: string };
  captions: Array<{ lang: 'en' | 'am'; url: string }>;
  sign: LessonTrack | null;
  audioDescription: { audioUrl: string; vttUrl: string; extended: boolean } | null;
  transcript: { url: string };
  pack: { manifestUrl: string; sizeBytes: number } | null;
  summary?: string | Partial<Record<'en' | 'am', string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isApiPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/v1/');
}

/** Validate untrusted API JSON before a player or optional feature uses its URLs. */
export function parseLessonManifest(value: unknown, expectedId?: string): LessonManifest {
  if (!isRecord(value)) throw new Error('Lesson manifest must be a JSON object.');
  if (typeof value.id !== 'string' || value.id.trim() === '') throw new Error('Lesson manifest is missing its id.');
  if (expectedId && value.id !== expectedId) throw new Error('The API returned a manifest for a different lesson.');

  if (!isRecord(value.title) || typeof value.title.en !== 'string' || typeof value.title.am !== 'string') {
    throw new Error('Lesson manifest title must include English and Amharic text.');
  }
  if (typeof value.durationSec !== 'number' || !Number.isFinite(value.durationSec) || value.durationSec < 0) {
    throw new Error('Lesson manifest duration must be a non-negative number.');
  }
  if (!isRecord(value.media) || !isHttpUrl(value.media.video) || !isHttpUrl(value.media.audio)) {
    throw new Error('Lesson manifest media must include valid HTTP or HTTPS video and audio URLs.');
  }
  if (!Array.isArray(value.captions)) throw new Error('Lesson manifest captions must be an array.');
  const captions = value.captions.map((caption) => {
    if (!isRecord(caption) || (caption.lang !== 'en' && caption.lang !== 'am') || !isHttpUrl(caption.url)) {
      throw new Error('Each caption track must have an en or am language and a valid HTTP or HTTPS URL.');
    }
    return { lang: caption.lang as 'en' | 'am', url: caption.url };
  });
  if (new Set(captions.map((caption) => caption.lang)).size !== captions.length) {
    throw new Error('Lesson manifest contains duplicate caption languages.');
  }

  let sign: LessonManifest['sign'] = null;
  if (value.sign !== null) {
    if (!isRecord(value.sign) || !isHttpUrl(value.sign.url) || typeof value.sign.offsetMs !== 'number' || !Number.isFinite(value.sign.offsetMs)) {
      throw new Error('Lesson manifest sign track must include a valid URL and numeric offsetMs, or be null.');
    }
    sign = { url: value.sign.url, offsetMs: value.sign.offsetMs };
  }

  let audioDescription: LessonManifest['audioDescription'] = null;
  if (value.audioDescription !== null) {
    if (!isRecord(value.audioDescription) || !isHttpUrl(value.audioDescription.audioUrl) || !isHttpUrl(value.audioDescription.vttUrl) || typeof value.audioDescription.extended !== 'boolean') {
      throw new Error('Lesson manifest audio description must include valid audio and VTT URLs and an extended flag, or be null.');
    }
    audioDescription = {
      audioUrl: value.audioDescription.audioUrl,
      vttUrl: value.audioDescription.vttUrl,
      extended: value.audioDescription.extended,
    };
  }

  if (!isRecord(value.transcript) || !isApiPath(value.transcript.url)) {
    throw new Error('Lesson manifest transcript URL must be a versioned API path.');
  }

  let pack: LessonManifest['pack'] = null;
  if (value.pack !== null) {
    if (!isRecord(value.pack) || !isApiPath(value.pack.manifestUrl) || typeof value.pack.sizeBytes !== 'number' || !Number.isInteger(value.pack.sizeBytes) || value.pack.sizeBytes < 0) {
      throw new Error('Lesson manifest pack must include a versioned manifest URL and non-negative sizeBytes, or be null.');
    }
    pack = { manifestUrl: value.pack.manifestUrl, sizeBytes: value.pack.sizeBytes };
  }

  let summary: LessonManifest['summary'];
  if (typeof value.summary === 'string') {
    summary = value.summary;
  } else if (value.summary !== undefined && value.summary !== null) {
    const summaryValue = value.summary;
    if (!isRecord(summaryValue)) {
      throw new Error('Lesson manifest summary must be text or an English/Amharic text map.');
    }
    if (['en', 'am'].some((lang) => summaryValue[lang] !== undefined && typeof summaryValue[lang] !== 'string')) {
      throw new Error('Lesson manifest summary must be text or an English/Amharic text map.');
    }
    summary = {
      ...(typeof summaryValue.en === 'string' ? { en: summaryValue.en } : {}),
      ...(typeof summaryValue.am === 'string' ? { am: summaryValue.am } : {}),
    };
  }

  return {
    id: value.id,
    title: { en: value.title.en, am: value.title.am },
    durationSec: value.durationSec,
    media: { video: value.media.video, audio: value.media.audio },
    captions,
    sign,
    audioDescription,
    transcript: { url: value.transcript.url },
    pack,
    ...(summary !== undefined ? { summary } : {}),
  };
}
