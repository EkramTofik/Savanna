/**
 * Savanna accessibility and lesson-player integration patch.
 *
 * Keeps the legacy course template's small accessibility corrections and
 * connects the visible language button to the actual Savanna player API.
 */
(() => {
  "use strict";

  function patchSavannaDefects() {
    document.querySelectorAll("div.flex-shrink-0[aria-expanded]").forEach((element) => {
      element.removeAttribute("aria-expanded");
    });

    document.querySelectorAll("a.logo-container").forEach((element) => {
      if (!element.getAttribute("aria-label") && !element.textContent.trim()) {
        element.setAttribute("aria-label", "Savanna Learning Platform Home");
      }
    });

    document.querySelectorAll(".progress-bar").forEach((element) => {
      if (!element.getAttribute("aria-label")) {
        element.setAttribute("aria-label", "Curriculum Progress");
      }
    });

    document
      .querySelectorAll('a[aria-hidden="true"], [aria-hidden="true"] a')
      .forEach((element) => element.setAttribute("tabindex", "-1"));

    document.querySelectorAll("ul > hr").forEach((hr) => {
      const listItem = document.createElement("li");
      listItem.style.listStyle = "none";
      hr.parentNode.insertBefore(listItem, hr);
      listItem.appendChild(hr);
    });

    wireLessonPlayerLanguage();
  }

  function wireLessonPlayerLanguage() {
    const button = document.querySelector("[data-savanna-language-toggle]");
    const player = document.getElementById("lesson-player");
    const status = document.getElementById("player-status");

    if (!button || !player || button.dataset.languageBound === "true") return;
    button.dataset.languageBound = "true";
    button.disabled = true;

    function updateButton(activeLanguage) {
      if (activeLanguage === "am") {
        button.textContent = "English";
        button.setAttribute("aria-label", "Switch player language to English");
      } else {
        button.textContent = "አማርኛ / Amharic";
        button.setAttribute("aria-label", "Switch player language to Amharic");
      }
    }

    window.addEventListener("savanna:lang-change", (event) => {
      const language = event.detail && event.detail.lang;
      if (language !== "en" && language !== "am") return;

      updateButton(language);
      if (status) {
        status.textContent =
          language === "am"
            ? "የተጫነው ቋንቋ አማርኛ ነው።"
            : "English player language selected.";
      }
    });

    customElements
      .whenDefined("savanna-player")
      .then(async () => {
        if (player.updateComplete) await player.updateComplete;

        if (typeof player.toggleLearningLanguage !== "function") {
          console.error("Savanna player does not expose toggleLearningLanguage().");
          button.textContent = "Language switching unavailable";
          if (status) status.textContent = "The player language control is unavailable.";
          return;
        }

        updateButton(player.activeLang || player.lang || "en");
        button.disabled = false;

        button.addEventListener("click", () => {
          player.toggleLearningLanguage();
        });

        if (status) {
          status.textContent = "Player controls are ready. Press Play to load the lesson.";
        }
      })
      .catch((error) => {
        console.error("Could not initialize Savanna language controls:", error);
        button.textContent = "Language controls unavailable";
        if (status) status.textContent = "The player controls could not be initialized.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchSavannaDefects, { once: true });
  } else {
    patchSavannaDefects();
  }
})();
