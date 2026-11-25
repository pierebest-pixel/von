// Service worker de Von : rend l'appli et les jeux installés disponibles hors connexion.
const APP_CACHE = "von-app-v3";
const SHELL = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "friends.js",
  "firebase-config.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/logo.png",
  "games/von-sdk.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("von-app-") && k !== APP_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Catalogue : réseau d'abord (pour voir les nouveaux jeux), sinon la dernière copie.
  if (url.pathname.endsWith("/games/catalog.json")) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_CACHE).then((c) => c.put("games/catalog.json", copy));
          return res;
        })
        .catch(() => caches.match("games/catalog.json"))
    );
    return;
  }

  // Fichiers de l'appli : cache d'abord, et mise à jour en arrière-plan
  // (la nouvelle version de Von s'affiche au lancement suivant).
  const isGameFile = url.pathname.includes("/games/") && !url.pathname.endsWith("/games/von-sdk.js");
  if (!isGameFile) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        const update = fetch(req)
          .then((res) => {
            if (res.ok) { const copy = res.clone(); caches.open(APP_CACHE).then((c) => c.put(req, copy)); }
            return res;
          })
          .catch(() => hit || caches.match("index.html"));
        return hit || update;
      })
    );
    return;
  }

  // Jeux installés : depuis le téléphone, sinon réseau.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => {
        if (req.mode === "navigate") return caches.match("index.html");
        return new Response("Hors connexion", { status: 503 });
      });
    })
  );
});
