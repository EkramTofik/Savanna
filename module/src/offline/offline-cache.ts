const CACHE_PREFIX = 'savanna-pack-';

/** Return a blob URL for an exact cached asset, or null when it is not saved. */
export async function getCachedObjectUrl(url: string): Promise<string | null> {
  if (typeof caches === 'undefined' || typeof URL.createObjectURL !== 'function') return null;
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith(CACHE_PREFIX)) continue;
      const response = await (await caches.open(name)).match(url);
      if (response) return URL.createObjectURL(await response.blob());
    }
  } catch {
    // Storage may be disabled or evicted; online playback can still use the source URL.
  }
  return null;
}
