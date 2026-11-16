export async function registerSavannaMediaWorker(url = "/media-sw.js") {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration(url);
    if (!navigator.onLine && existing?.active) {
      await navigator.serviceWorker.ready;
      await cacheApplicationShell();
      return existing;
    }
    const script = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!script.ok || !script.headers.get("content-type")?.toLowerCase().includes("javascript"))
      return null;
    const registration = await navigator.serviceWorker.register(url, { scope: "/" });
    await navigator.serviceWorker.ready;
    await cacheApplicationShell();
    if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
    return registration;
  } catch {
    // Direct Cache API use remains available even when the host has not deployed the worker.
    return null;
  }
}

async function cacheApplicationShell(): Promise<void> {
  const cache = await caches.open("savanna-media-v2-static");
  const urls = new Set<string>([window.location.href]);
  for (const element of document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
    'script[src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]',
  )) {
    const source = element instanceof HTMLScriptElement ? element.src : element.href;
    if (source && new URL(source).origin === window.location.origin) urls.add(source);
  }
  for (const source of urls) {
    const parsed = new URL(source);
    if (parsed.pathname.startsWith("/v1/") || parsed.pathname.startsWith("/api/v1/")) continue;
    try {
      const response = await fetch(source, { credentials: "same-origin", cache: "no-store" });
      if (response.ok) await cache.put(source, response);
    } catch {
      // Keep already cached shell files if the host becomes temporarily unavailable.
    }
  }
}
