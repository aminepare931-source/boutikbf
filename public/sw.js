/* BoutikBF — service worker
 * Stratégie :
 *  - /assets/* (fichiers hashés immuables) : cache-durée (stale-while-revalidate)
 *  - navigations HTML : réseau d'abord, cache si hors-ligne (la caisse hors-ligne
 *    utilise IndexedDB via offline-queue.ts, pas ce cache)
 *  - jamais de cache des appels supabase (cross-origin)
 */
const ASSETS = "boutikbf-assets-v1";
const PAGES = "boutikbf-pages-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== ASSETS && k !== PAGES).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // supabase, fonts, etc. : on ne touche pas

  // Fichiers statiques hashés : cache prioritaire
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/logo")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const hit = await cache.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit ?? net;
      })(),
    );
    return;
  }

  // Pages : réseau d'abord, fallback cache hors-ligne
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGES);
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req);
          return (
            hit ??
            (await cache.match("/")) ??
            new Response("<h1>Hors-ligne</h1><p>Rechargez quand le réseau revient.</p>", {
              headers: { "content-type": "text/html" },
              status: 503,
            })
          );
        }
      })(),
    );
  }
});
