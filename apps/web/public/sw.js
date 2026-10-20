const SHELL_CACHE = "astro-engine-shell-v2";
const CACHE_PREFIX = "astro-engine-shell-";
const SHELL = ["/offline.html", "/manifest.webmanifest", "/icon"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheable =
    url.origin === self.location.origin &&
    url.search === "" &&
    (event.request.mode === "navigate" ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/offline.html" ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/icon");
  if (event.request.method !== "GET" || !cacheable) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.mode !== "navigate") {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(SHELL_CACHE)
              .then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(() =>
        event.request.mode === "navigate"
          ? caches.match("/offline.html")
          : caches
              .match(event.request)
              .then((cached) => cached || Response.error()),
      ),
  );
});
