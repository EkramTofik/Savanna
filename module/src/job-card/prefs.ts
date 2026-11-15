const KEY = "savanna.prefs.v1";

export type JobsPrefs = {
  lastJobId?: string;
  transcriptOpen?: boolean;
};

export function readJobsPrefs(): JobsPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as { jobs?: JobsPrefs };
    return all.jobs ?? {};
  } catch {
    return {};
  }
}

export function writeJobsPrefs(patch: JobsPrefs): void {
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const jobs = { ...((all.jobs as JobsPrefs) ?? {}), ...patch };
    localStorage.setItem(KEY, JSON.stringify({ ...all, jobs }));
  } catch {
    /* quota / private mode */
  }
}

export function resolveLang(el: HTMLElement, attr: string): "en" | "am" {
  const value = (attr || el.lang || document.documentElement.lang || "am").slice(0, 2);
  return value === "am" ? "am" : "en";
}
