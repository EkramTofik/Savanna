import type { Transcript } from "../schemas/lesson";
import type { Preferences } from "../schemas/preferences";
import { loadSeedData } from "./seedData";
import type { LessonRecord, Store } from "./store";

/** No database needed: lessons come from contracts/fixtures. Preferences live in RAM (lost on restart). */
export function createMemoryStore(): Store {
  const { lessons, transcripts } = loadSeedData();
  const byId = new Map<string, LessonRecord>(lessons.map((l) => [l.id, l]));
  const tr = new Map<string, Transcript>(transcripts.map((t) => [`${t.id}:${t.lang}`, t]));
  const prefs = new Map<string, Preferences>();
  return {
    listLessons: async () => [...byId.values()],
    getLesson: async (id) => byId.get(id) ?? null,
    getTranscript: async (id, lang) => tr.get(`${id}:${lang}`) ?? null,
    getPreferences: async (h) => prefs.get(h) ?? null,
    setPreferences: async (h, p) => void prefs.set(h, p),
  };
}
