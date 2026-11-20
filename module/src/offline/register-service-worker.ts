export async function registerSavannaMediaWorker(url = "/media-sw.js") {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(url, {
      scope: "/",
      updateViaCache: "none",
    });
    if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
    return registration;
  } catch (error) {
    console.warn("Offline support unavailable", error);
    return null;
  }
}
