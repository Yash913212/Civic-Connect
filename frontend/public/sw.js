const CACHE_NAME = "civic-connect-v1";
const STATIC_CACHE = "civic-connect-static-v1";
const API_CACHE = "civic-connect-api-v1";
const OFFLINE_QUEUE = "civic-connect-offline-queue";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

const API_CACHE_PATTERNS = [
  /\/api\/complaints/,
  /\/api\/users\/me/,
  /\/api\/notifications/,
  /\/api\/departments/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== CACHE_NAME && name !== OFFLINE_QUEUE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) requests (e.g., chrome-extension://, moz-extension://, etc.)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API requests: network-first with cache fallback
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Static assets: cache-first
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation: network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME));
    return;
  }
});

// Background Sync for offline complaints
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-complaints") {
    event.waitUntil(syncOfflineComplaints());
  }
});

async function syncOfflineComplaints() {
  const cache = await caches.open(OFFLINE_QUEUE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const body = await response.json();
      
      // Re-send the complaint to the server
      const serverResponse = await fetch(request, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": body.token || "",
        },
        body: JSON.stringify(body.data),
      });
      
      if (serverResponse.ok) {
        await cache.delete(request);
        // Notify the client of successful sync
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "COMPLAINT_SYNCED",
            data: { id: body.data.tempId },
          });
        });
      }
  } catch {
      console.error("Failed to sync complaint");
    }
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    if (request.mode === "navigate") {
      return caches.match("/");
    }
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
