export function resolveLang(el: HTMLElement, attr: string): "en" | "am" {
  const value = (attr || el.lang || document.documentElement.lang || "en").slice(0, 2);
  return value === "am" ? "am" : "en";
}
