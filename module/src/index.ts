/**
 * Savanna Access Kit browser entry point.
 *
 * The player is the core component. Optional components are split into
 * separate ESM chunks and loaded only when their custom element is present.
 * Sign and audio-description modules are loaded by the player after a lesson
 * manifest proves that the corresponding media exists.
 */

import "./player/savanna-player.js";

export { SavannaPlayer } from "./player/savanna-player.js";

type OptionalModule = {
  selector: string;
  load: () => Promise<unknown>;
};

const optionalModules: OptionalModule[] = [
  { selector: "savanna-offline", load: () => import("./offline/offline.js") },
  { selector: "savanna-job-card", load: () => import("./job-card/job-card.js") },
  { selector: "savanna-credential", load: () => import("./credential/credential.js") },
  {
    selector: "savanna-sign-window[src], [data-sign-window][src]",
    load: () => import("./sign-window/sign-window.js"),
  },
  {
    selector: "savanna-audio-description[src], savanna-audio-description[text-vtt]",
    load: () => import("./audio-description/audio-description.js"),
  },
];

const moduleLoads = new Map<string, Promise<unknown>>();

function loadOptionalModulesForExistingElements(): void {
  if (typeof document === "undefined") return;
  for (const optional of optionalModules) {
    if (!document.querySelector(optional.selector)) continue;
    const pending = moduleLoads.get(optional.selector) ?? optional.load();
    moduleLoads.set(optional.selector, pending);
    void pending.catch((error: unknown) => {
      console.error(`[savanna-access] Could not load ${optional.selector}:`, error);
      moduleLoads.delete(optional.selector);
    });
  }
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  const startObserver = (): void => {
    if (!document.documentElement) return;
    const observer = new MutationObserver(loadOptionalModulesForExistingElements);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    loadOptionalModulesForExistingElements();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
}
