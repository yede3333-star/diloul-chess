/*
 * Diloul service worker (SPEC §17.2). Deliberately conservative:
 * - Built assets (/_next/static, icons): cache-first; their names change on every deploy.
 * - Page navigations: network-first; the last visited copy is used only when offline,
 *   so a deploy is never hidden behind a stale page.
 * - Everything else (data, Supabase, other origins, non-GET): untouched.
 * Bump VERSION to drop every old cache.
 */
const VERSION = "v1";
const STATIC_CACHE = `diloul-static-${VERSION}`;
const PAGE_CACHE = `diloul-pages-${VERSION}`;
const MAX_PAGES = 60;

const OFFLINE_HTML = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ديلول · غير متصل</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#11152a;color:#eee7da;font:16px/1.7 system-ui,sans-serif;text-align:center;padding:24px}button{margin-top:16px;padding:12px 24px;border:0;border-radius:999px;background:#e9b864;color:#21160a;font-weight:700;font-size:16px}</style></head>
<body><main><h1>لا يوجد اتصال بالإنترنت</h1><p>هذه الصفحة لم تُفتح من قبل على هذا الجهاز. الصفحات التي زرتها تعمل دون اتصال.</p>
<p lang="fr" dir="ltr">Pas de connexion. Cette page n’a pas encore été ouverte sur cet appareil.</p>
<button onclick="location.reload()">حاول مجددًا · Réessayer</button></main></body></html>`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("diloul-") && k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function trimPages() {
  const cache = await caches.open(PAGE_CACHE);
  const keys = await cache.keys();
  for (const req of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(req);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Sign-in callbacks and internal pages are never cached.
  const skip = url.pathname.startsWith("/api/") || url.pathname.includes("/auth/") || url.pathname.includes("/dev/") || url.searchParams.has("code");
  if (req.mode === "navigate" && !skip) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && res.type === "basic") {
            const cache = await caches.open(PAGE_CACHE);
            await cache.put(req, res.clone());
            trimPages();
          }
          return res;
        } catch {
          const hit = await caches.match(req, { cacheName: PAGE_CACHE, ignoreSearch: true });
          return hit ?? new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
      })(),
    );
  }
});
