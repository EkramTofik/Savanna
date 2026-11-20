/**
 * Savanna lesson routing.
 *
 * Supports the L-102 and L-103 fixture lessons through the query string.
 * Keeps the player, offline-download component, and navigation state in sync.
 */
(() => {
  "use strict";

  const availableLessons = new Set(["L-102", "L-103"]);

  function applyLessonRoute() {
    const requestedLesson = new URL(window.location.href).searchParams.get("lesson");
    const lessonId =
      requestedLesson && availableLessons.has(requestedLesson)
        ? requestedLesson
        : "L-102";

    const player = document.getElementById("lesson-player");
    if (!player) {
      console.error("Savanna lesson routing: #lesson-player was not found.");
      return;
    }

    player.setAttribute("lesson", lessonId);

    const offline = player.querySelector("savanna-offline");
    if (offline) offline.setAttribute("lesson-id", lessonId);

    document.querySelectorAll("#course-lesson-links [data-lesson-id]").forEach((link) => {
      const selected = link.getAttribute("data-lesson-id") === lessonId;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const status = document.getElementById("course-lesson-nav-status");
    if (status) {
      status.textContent =
        requestedLesson && !availableLessons.has(requestedLesson)
          ? `Lesson ${requestedLesson} is unavailable. Showing L-102 instead.`
          : `Lesson ${lessonId} selected.`;
    }
  }

  applyLessonRoute();
  window.addEventListener("popstate", applyLessonRoute);
  window.addEventListener("hashchange", applyLessonRoute);
})();
