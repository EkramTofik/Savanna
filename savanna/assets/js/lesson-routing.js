/**
 * Lesson routing and navigation for Savanna demo pages.
 * Handles ?lesson= query parameter and updates the player + navigation UI.
 * 
 * This script is externalized to comply with Content Security Policy (CSP)
 * that prohibits inline scripts. No inline event handlers or eval.
 */

(() => {
  const availableLessons = new Set(["L-102", "L-103"]);
  
  const applyLessonRoute = () => {
    const requested = new URL(window.location.href).searchParams.get("lesson");
    const lessonId = requested && availableLessons.has(requested) ? requested : "L-102";
    const player = document.querySelector("savanna-player#lesson-player");
    const offline = player?.querySelector("savanna-offline");
    
    if (player) player.setAttribute("lesson", lessonId);
    if (offline) offline.setAttribute("lesson-id", lessonId);

    document.querySelectorAll("#course-lesson-links [data-lesson-id]").forEach((link) => {
      const selected = link.getAttribute("data-lesson-id") === lessonId;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const status = document.getElementById("course-lesson-nav-status");
    if (status) {
      status.textContent = requested && !availableLessons.has(requested)
        ? `Lesson ${requested} is not available in this local export. Showing L-102.`
        : "";
    }
  };

  applyLessonRoute();
  window.addEventListener("popstate", applyLessonRoute);
  window.addEventListener("hashchange", applyLessonRoute);
})();
