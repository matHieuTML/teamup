// TeamUp Service Worker - PWA Features
// Version 1.0.0

const CACHE_NAME = "teamup-v1.0.0";
const STATIC_CACHE = "teamup-static-v1.0.0";
const DYNAMIC_CACHE = "teamup-dynamic-v1.0.0";

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/images/logo/ios/192.png",
  "/images/logo/ios/512.png",
  // Core pages for offline access
  "/profile",
  "/events",
  "/places",
  // Fonts
  "/fonts/Montserrat-Regular.woff2",
  "/fonts/Montserrat-Bold.woff2",
  "/fonts/Aconchego-Regular.woff2",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static assets", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // API requests - try network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline fallback for critical API calls
            if (
              url.pathname.includes("/events") ||
              url.pathname.includes("/profile")
            ) {
              return new Response(
                JSON.stringify({
                  error: "Offline",
                  message:
                    "Cette fonctionnalité nécessite une connexion internet",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          });
        })
    );
    return;
  }

  // Static assets and pages - cache first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Cache the response
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback for pages
          if (request.headers.get("accept").includes("text/html")) {
            return (
              caches.match("/offline.html") ||
              caches.match("/") ||
              new Response(
                "<h1>TeamUp</h1><p>Vous êtes hors ligne. Reconnectez-vous pour accéder à toutes les fonctionnalités.</p>",
                { headers: { "Content-Type": "text/html" } }
              )
            );
          }
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag);

  if (event.tag === "background-sync-events") {
    event.waitUntil(syncOfflineActions());
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const options = {
    body: event.data ? event.data.text() : "Nouvelle notification TeamUp",
    icon: "/images/logo/ios/192.png",
    badge: "/images/logo/ios/96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      {
        action: "explore",
        title: "Voir l'événement",
        icon: "/images/icons/explore.png",
      },
      {
        action: "close",
        title: "Fermer",
        icon: "/images/icons/close.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("TeamUp", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification click", event.action);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/events"));
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = JSON.parse(
      localStorage.getItem("offlineActions") || "[]"
    );

    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        // Remove successful action from offline queue
        const updatedActions = offlineActions.filter((a) => a.id !== action.id);
        localStorage.setItem("offlineActions", JSON.stringify(updatedActions));
      } catch (error) {
        console.error("Service Worker: Failed to sync action", action, error);
      }
    }
  } catch (error) {
    console.error("Service Worker: Error syncing offline actions", error);
  }
}

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log("Service Worker: Loaded successfully");
