// IEP service worker — real PWA: precaches the app shell, network-first for
// navigations, cache-first for static assets, offline fallback for the
// hardcoded IEP route.

const VERSION = "iep-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const APP_SHELL = [
  "/",
  "/planner",
  "/about",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (c) => {
      // Best-effort precache — never fail the install.
      await Promise.allSettled(APP_SHELL.map((u) => c.add(u)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Map tiles — cache-first with revalidation.
  if (
    url.hostname.endsWith("maptiler.com") ||
    url.hostname.endsWith("openstreetmap.org")
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fetchPromise;
      }),
    );
    return;
  }

  // OSRM public demo — network only (short TTL upstream).
  if (url.hostname === "router.project-osrm.org") {
    return;
  }

  // Same-origin — navigate vs static asset differently.
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith(
        (async () => {
          try {
            const fresh = await fetch(req);
            const cache = await caches.open(SHELL_CACHE);
            cache.put(req, fresh.clone());
            return fresh;
          } catch {
            const cache = await caches.open(SHELL_CACHE);
            const hit =
              (await cache.match(req)) ||
              (await cache.match("/planner")) ||
              (await cache.match("/"));
            if (hit) return hit;
            return new Response("Offline", { status: 503 });
          }
        })(),
      );
      return;
    }
    if (APP_SHELL.includes(url.pathname) || url.pathname.startsWith("/icon-")) {
      event.respondWith(
        caches.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
              return res;
            }),
        ),
      );
      return;
    }
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
