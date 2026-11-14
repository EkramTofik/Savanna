import { escapeHtml } from "../../api/src/routes/career-lib.js";

export function applyFormHtml(jobId: string): string {
  const id = escapeHtml(jobId);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Apply — ${id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font: 1.125rem/1.5 system-ui, sans-serif; margin: 0; padding: 1.25rem; max-width: 40rem; }
    label { display: block; font-weight: 700; margin-top: 1rem; }
    input, textarea { width: 100%; min-height: 44px; font: inherit; padding: 0.4rem; }
    button { min-height: 44px; min-width: 44px; font: inherit; margin-top: 1rem; padding: 0.5rem 1rem; }
    .error { color: #7a1010; background: #fde8e8; padding: 0.75rem; }
    :focus { outline: 3px solid #0b5cab; outline-offset: 2px; }
  </style>
</head>
<body>
  <main>
    <h1>Apply for job ${id}</h1>
    <p>There is no time limit on this form. You can save and return.</p>
    <div id="errors" class="error" hidden role="alert"></div>
    <form id="apply" novalidate>
      <label for="name">Full name</label>
      <input id="name" name="name" required autocomplete="name">
      <label for="contact">Email or phone</label>
      <input id="contact" name="contact" required autocomplete="email">
      <label for="why">Why this role? (plain language is welcome)</label>
      <textarea id="why" name="why" rows="5" required></textarea>
      <button type="submit">Send application</button>
    </form>
    <p id="done" role="status" aria-live="polite"></p>
  </main>
  <script>
    const form = document.getElementById("apply");
    const errors = document.getElementById("errors");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const missing = [...form.querySelectorAll("[required]")].filter((el) => !el.value.trim());
      if (missing.length) {
        errors.hidden = false;
        errors.innerHTML = "<p>Please fill: " + missing.map((el) => {
          const label = form.querySelector("label[for='" + el.id + "']");
          return label ? label.textContent : el.id;
        }).join(", ") + ".</p>";
        missing[0].focus();
        return;
      }
      errors.hidden = true;
      document.getElementById("done").textContent = "Application recorded locally for the demo. Thank you.";
      form.reset();
    });
  </script>
</body>
</html>`;
}
