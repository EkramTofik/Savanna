import test from "node:test";
import assert from "node:assert/strict";
import { loadStoredPlayerLanguagePreference, PREFS_STORAGE_KEY } from "./preferences-manager.ts";

function withLocalStorage(value: string | null, run: () => void): void {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => (key === PREFS_STORAGE_KEY ? value : null) },
  });
  try {
    run();
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
}

test("keeps the host language when there is no saved UI language", () => {
  withLocalStorage(null, () => assert.equal(loadStoredPlayerLanguagePreference(), null));
  withLocalStorage(JSON.stringify({ captions: { lang: "am" } }), () =>
    assert.equal(loadStoredPlayerLanguagePreference(), null),
  );
});

test("loads only an explicitly saved English or Amharic UI language", () => {
  withLocalStorage(JSON.stringify({ ui: { lang: "am" } }), () =>
    assert.equal(loadStoredPlayerLanguagePreference(), "am"),
  );
  withLocalStorage(JSON.stringify({ ui: { lang: "fr" } }), () =>
    assert.equal(loadStoredPlayerLanguagePreference(), null),
  );
});
