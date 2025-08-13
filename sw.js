const CACHE = "wt-v1";
const ASSETS = ["/", "/index.html", "/style.css", "/script.js"];

// Install: cache shell files
self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
});

// Fetch: cache-first for static, always network for API/auth
self.addEventListener("fetch", (e) => {
    const url = e.request.url;
    if (url.includes("/api/") || url.includes("/.auth/")) return; // keep data/auth fresh
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
