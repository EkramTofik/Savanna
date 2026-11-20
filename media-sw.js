const VERSION = "savanna-media-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PACK_PREFIX = "savanna-pack-";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await caches.open(STATIC_CACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("savanna-media-") && key !== STATIC_CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

async function findSavedRequest(request) {
  for (const key of await caches.keys()) {
    if (!key.startsWith(PACK_PREFIX)) continue;
    const cache = await caches.open(key);
    const response = await cache.match(request.url);
    if (response) return response;
  }
  return null;
}

async function rangedResponse(response, rangeHeader) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416 });
  const body = await response.arrayBuffer();
  const suffix = match[1] ? 0 : Number(match[2]);
  const start = match[1] ? Number(match[1]) : Math.max(0, body.byteLength - suffix);
  const requestedEnd = match[1] && match[2] ? Number(match[2]) : body.byteLength - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start >= body.byteLength ||
    requestedEnd < start
  ) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${body.byteLength}` },
    });
  }
  const end = Math.min(requestedEnd, body.byteLength - 1);
  const headers = new Headers(response.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${body.byteLength}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (
    url.origin === self.location.origin &&
    !url.pathname.startsWith("/v1/") &&
    !url.pathname.startsWith("/api/v1/") &&
    (request.mode === "navigate" ||
      request.destination === "font" ||
      request.destination === "image" ||
      /\.(html?|m?js|css|woff2?|svg|png|jpe?g)$/i.test(url.pathname))
  ) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) await (await caches.open(STATIC_CACHE)).put(request, response.clone());
          return response;
        } catch {
          return (
            (await (await caches.open(STATIC_CACHE)).match(request, { ignoreVary: true })) ||
            new Response("This lesson page is not available offline yet.", { status: 503 })
          );
        }
      })(),
    );
    return;
  }

  if (/\/v1\/lessons\/[^/]+\/pack$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) await (await caches.open(STATIC_CACHE)).put(request, response.clone());
          return response;
        } catch {
          return (
            (await (await caches.open(STATIC_CACHE)).match(request, { ignoreVary: true })) ||
            new Response(
              JSON.stringify({
                title: "Offline pack unavailable",
                detail: "Connect once to load this pack.",
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/problem+json" },
              },
            )
          );
        }
      })(),
    );
    return;
  }

  if (url.pathname.endsWith("/pack.zip") || url.pathname.includes("/media/")) {
    event.respondWith(
      (async () => {
        const saved = await findSavedRequest(request);
        if (saved)
          return request.headers.has("Range")
            ? rangedResponse(saved, request.headers.get("Range"))
            : saved;
        try {
          return await fetch(request);
        } catch {
          return new Response("Offline pack is not saved on this device.", { status: 503 });
        }
      })(),
    );
  }
});
