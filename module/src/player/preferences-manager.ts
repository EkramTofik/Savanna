/**
 * Preferences Manager for <savanna-player> (Contract C3, SRS FR-P9, Task 1.6).
 *
 * Contract C3 specification:
 * LocalStorage key 'savanna.prefs.v1' is a shared JSON object across components.
 * Namespaces:
 *   - 'ui' & 'captions' -> Owned strictly by Member 1 (Player Experience).
 *   - 'sign', 'ad', 'offline' -> Owned strictly by Member 2 (DO NOT OVERWRITE).
 *   - 'jobs' -> Owned strictly by Member 3 (DO NOT OVERWRITE).
 *
 * Every load/save must preserve peer namespaces untouched!
 */

export interface UiPreferences {
  lang: "en" | "am";
  speed: number;
  theme: "dark" | "light" | "high-contrast";
  shortcuts: boolean;
  lowData: boolean;
}

export interface CaptionsPreferences {
  enabled: boolean;
  lang: "en" | "am" | "off";
  fontSize: number; // 100, 150, 200, 300
  preset: "white-black" | "yellow-black" | "black-white" | "custom";
  textColor: string;
  bgColor: string;
  bgOpacity: number; // 0, 50, 75, 100
  position: "bottom" | "top";
}

export interface PlayerPreferences {
  ui: UiPreferences;
  captions: CaptionsPreferences;
}

export const PREFS_STORAGE_KEY = "savanna.prefs.v1";

/** Returns a saved UI language when one was explicitly chosen; null keeps the host's lang attribute. */
export function loadStoredPlayerLanguagePreference(): "en" | "am" | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;
    const lang = JSON.parse(raw)?.ui?.lang;
    return lang === "en" || lang === "am" ? lang : null;
  } catch {
    return null;
  }
}

export function getDefaultUiPreferences(): UiPreferences {
  return {
    lang: "en",
    speed: 1,
    theme: "dark",
    shortcuts: true,
    lowData: false,
  };
}

export function getDefaultCaptionsPreferences(): CaptionsPreferences {
  return {
    enabled: false,
    lang: "en",
    fontSize: 100,
    preset: "white-black",
    textColor: "#ffffff",
    bgColor: "#000000",
    bgOpacity: 80,
    position: "bottom",
  };
}

/**
 * Loads Member 1's preferences (ui, captions) from localStorage without modifying any peer namespaces.
 */
export function loadPlayerPreferences(): PlayerPreferences {
  const defaults: PlayerPreferences = {
    ui: getDefaultUiPreferences(),
    captions: getDefaultCaptionsPreferences(),
  };

  try {
    if (typeof localStorage === "undefined") return defaults;
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;

    // 1. Resolve 'ui' namespace
    if (parsed.ui && typeof parsed.ui === "object") {
      const u = parsed.ui;
      if (u.lang === "en" || u.lang === "am") {
        defaults.ui.lang = u.lang;
      }
      if (typeof u.speed === "number" && u.speed >= 0.5 && u.speed <= 2.5) {
        defaults.ui.speed = u.speed;
      }
      if (u.theme === "dark" || u.theme === "light" || u.theme === "high-contrast") {
        defaults.ui.theme = u.theme;
      }
      if (typeof u.shortcuts === "boolean") {
        defaults.ui.shortcuts = u.shortcuts;
      }
      if (typeof u.lowData === "boolean") {
        defaults.ui.lowData = u.lowData;
      }
    }

    // 2. Resolve 'captions' namespace
    if (parsed.captions && typeof parsed.captions === "object") {
      const c = parsed.captions;
      if (typeof c.enabled === "boolean") {
        defaults.captions.enabled = c.enabled;
      }
      if (c.lang === "en" || c.lang === "am" || c.lang === "off") {
        defaults.captions.lang = c.lang;
      }
      if (typeof c.fontSize === "number" && [100, 150, 200, 300].includes(c.fontSize)) {
        defaults.captions.fontSize = c.fontSize;
      }
      if (["white-black", "yellow-black", "black-white", "custom"].includes(c.preset)) {
        defaults.captions.preset = c.preset;
      }
      if (typeof c.textColor === "string" && c.textColor.length > 0) {
        defaults.captions.textColor = c.textColor;
      }
      if (typeof c.bgColor === "string" && c.bgColor.length > 0) {
        defaults.captions.bgColor = c.bgColor;
      }
      if (typeof c.bgOpacity === "number") {
        defaults.captions.bgOpacity = Math.max(0, Math.min(100, c.bgOpacity));
      }
      if (c.position === "bottom" || c.position === "top") {
        defaults.captions.position = c.position;
      }
    }
  } catch {
    // If corrupted, fallback gracefully to defaults
  }

  return defaults;
}

/**
 * Saves Member 1's preferences to localStorage.
 * CRITICAL (Contract C3): Reads the existing object and updates ONLY 'ui' and 'captions'.
 * Any peer keys ('sign', 'ad', 'offline', 'jobs') are preserved exactly as they are!
 */
export function savePlayerPreferences(ui: UiPreferences, captions: CaptionsPreferences): void {
  try {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    let root: Record<string, unknown> = {};

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          root = parsed;
        }
      } catch {
        root = {};
      }
    }

    // Modify ONLY Member 1's namespaces
    root["ui"] = {
      lang: ui.lang,
      speed: ui.speed,
      theme: ui.theme,
      shortcuts: ui.shortcuts,
      lowData: ui.lowData,
    };

    root["captions"] = {
      enabled: captions.enabled,
      lang: captions.lang,
      fontSize: captions.fontSize,
      preset: captions.preset,
      textColor: captions.textColor,
      bgColor: captions.bgColor,
      bgOpacity: captions.bgOpacity,
      position: captions.position,
    };

    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(root));
  } catch {
    // Storage quota or sandboxed iframe restriction
  }
}
