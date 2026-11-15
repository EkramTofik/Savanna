import type { Lang, Transcript } from "../schemas/lesson";
import type { Preferences } from "../schemas/preferences";

export type AssetKind =
  | "video" | "audio" | "vtt" | "sign" | "ad_audio" | "ad_vtt"
  | "transcript_html" | "pdf" | "pack" | "brf";

export interface AssetRecord {
  kind: AssetKind;
  lang: string | null;
  url: string;
  bytes: number;
  checksum: string;
  reviewed: boolean;
  meta: Record<string, unknown> | null;
}

export interface LessonRecord {
  id: string;
  title: { en: string; am: string };
  durationSec: number;
  assets: AssetRecord[];
}

/** Everything the content routes need. Two implementations: memory (fixtures) and Prisma (PostgreSQL). */
export interface Store {
  listLessons(): Promise<LessonRecord[]>;
  getLesson(id: string): Promise<LessonRecord | null>;
  getTranscript(lessonId: string, lang: Lang): Promise<Transcript | null>;
  getPreferences(userHash: string): Promise<Preferences | null>;
  setPreferences(userHash: string, prefs: Preferences): Promise<void>;
}
