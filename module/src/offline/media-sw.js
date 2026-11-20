const PREFIX = "savanna-pack-";
const SHELL_CACHE = "savanna-shell-v1";
const LESSON_REQUEST = /\/v1\/lessons\/[^/]+(?:\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function findSavedResponse(request) {
  const names = (await caches.keys()).filter((name) => name.startsWith(PREFIX));
  for (const name of names) {
    const response = await (await caches.open(name)).match(request);
    if (response) return response;
  }
  return null;
}

async function networkFirstAndCache(request) {
  const shell = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await shell.put(request, response.clone());
    return response;
  } catch {
    const cached = await shell.match(request);
    if (cached) return cached;
    return new Response("This lesson page or its app files are not available offline yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function rangeResponse(request, response) {
  const value = request.headers.get("Range");
  const match = value && /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || response.status !== 200) return response;

  const content = await response.arrayBuffer();
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2]
    ? Math.min(Number(match[2]), content.byteLength - 1)
    : content.byteLength - 1;
  if (start >= content.byteLength || end < start) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${content.byteLength}` },
    });
  }
  const headers = new Headers(response.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes ${start}-${end}/${content.byteLength}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(content.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (
    request.mode === "navigate" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(networkFirstAndCache(request));
    return;
  }

  const url = new URL(request.url);
  const isLessonAsset =
    LESSON_REQUEST.test(url.pathname) ||
    url.pathname.startsWith("/media/") ||
    url.pathname.startsWith("/savanna-offline/");
  if (!isLessonAsset) return;

  event.respondWith(
    (async () => {
      const cached = await findSavedResponse(request);
      if (cached) return rangeResponse(request, cached);
      try {
        return await fetch(request);
      } catch {
        return new Response("This lesson file is not saved on this device.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
