import "../../../packages/components/src/job-card/job-card.ts";
import "../../../packages/components/src/credential/credential.ts";

const langButtons = document.querySelectorAll<HTMLButtonElement>("[data-lang]");
langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang ?? "en";
    document.documentElement.lang = lang;
    document.querySelectorAll("savanna-job-card, savanna-credential").forEach((el) => {
      el.setAttribute("lang", lang);
    });
    window.dispatchEvent(
      new CustomEvent("savanna:lang-change", { bubbles: true, composed: true, detail: { lang } }),
    );
  });
});
