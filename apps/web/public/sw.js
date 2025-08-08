/**
 * Service Worker for ClaimGuardian PWA
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = "claimguardian-v1.0.0";
const RUNTIME_CACHE = "runtime-cache-v1";
const OFFLINE_PAGE = "/offline";
const OFFLINE_IMAGE = "/images/offline-placeholder.png";

// Assets to cache immediately on install
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/dashboard/properties",
  "/dashboard/ai-tools",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/images/offline-placeholder.png",
];

// Routes that should always try network first
const NETWORK_FIRST_ROUTES = ["/api/", "/auth/", "/dashboard/api/"];

// Routes that can be served from cache first
const CACHE_FIRST_ROUTES = [
  "/static/",
  "/icons/",
  "/images/",
  "/_next/static/",
  "/fonts/",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("[SW] Old caches cleaned up");
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip auth routes entirely - bypass service worker
  if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/auth/')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle different types of requests
  if (isNetworkFirstRoute(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirstRoute(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isHTMLRequest(request)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

// Network first strategy (for API calls)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This request requires an internet connection",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Cache first strategy (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache the response
    if (networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network and cache failed for:", request.url);

    // Return offline image for failed image requests
    if (request.destination === "image") {
      return caches.match(OFFLINE_IMAGE);
    }

    return new Response("Offline", { status: 503 });
  }
}

// Stale while revalidate strategy (for HTML pages)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (response.status === 200) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse) {
    networkResponsePromise; // Update cache in background
    return cachedResponse;
  }

  // Otherwise wait for network
  try {
    return await networkResponsePromise;
  } catch (error) {
    console.log("[SW] Serving offline page for:", request.url);
    return caches.match(OFFLINE_PAGE);
  }
}

// Helper functions
function isNetworkFirstRoute(url) {
  return NETWORK_FIRST_ROUTES.some((route) => url.includes(route));
}

function isCacheFirstRoute(url) {
  return CACHE_FIRST_ROUTES.some((route) => url.includes(route));
}

function isHTMLRequest(request) {
  return request.headers.get("accept")?.includes("text/html");
}

// Background sync for form submissions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "property-sync") {
    event.waitUntil(syncPendingProperties());
  } else if (event.tag === "claim-sync") {
    event.waitUntil(syncPendingClaims());
  }
});

async function syncPendingProperties() {
  console.log("[SW] Syncing pending properties");
  // Implementation for syncing offline property data
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const pendingProperties = await cache.match("/offline/properties");

    if (pendingProperties) {
      const data = await pendingProperties.json();
      // Sync with server API
      await fetch("/api/properties/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Clear pending data
      await cache.delete("/offline/properties");
      console.log("[SW] Properties synced successfully");
    }
  } catch (error) {
    console.error("[SW] Failed to sync properties:", error);
  }
}

async function syncPendingClaims() {
  console.log("[SW] Syncing pending claims");
  // Implementation for syncing offline claim data
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const pendingClaims = await cache.match("/offline/claims");

    if (pendingClaims) {
      const data = await pendingClaims.json();
      // Sync with server API
      await fetch("/api/claims/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Clear pending data
      await cache.delete("/offline/claims");
      console.log("[SW] Claims synced successfully");
    }
  } catch (error) {
    console.error("[SW] Failed to sync claims:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url,
        id: data.id,
      },
      actions: [
        {
          action: "view",
          title: "View",
          icon: "/icons/action-view.png",
        },
        {
          action: "dismiss",
          title: "Dismiss",
          icon: "/icons/action-dismiss.png",
        },
      ],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "ClaimGuardian",
        options,
      ),
    );
  } catch (error) {
    console.error("[SW] Failed to show push notification:", error);
  }
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.action);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Message handling for communication with main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_PROPERTY") {
    // Cache property data for offline access
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.put(
        `/offline/property/${event.data.id}`,
        new Response(JSON.stringify(event.data.property)),
      );
    });
  }
});

// Error handling
self.addEventListener("error", (event) => {
  console.error("[SW] Error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event.reason);
});
