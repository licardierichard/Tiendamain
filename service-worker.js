// Enhanced Service Worker for PWA
const CACHE_NAME = "inviteu-v1.0.0"
const STATIC_CACHE = "inviteu-static-v1.0.0"
const DYNAMIC_CACHE = "inviteu-dynamic-v1.0.0"

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/index.html",
  "/css/critical.css",
  "/css/components.css",
  "/css/modals.css",
  "/css/responsive.css",
  "/js/main.js",
  "/js/config.js",
  "/js/modules/utils.js",
  "/js/modules/data.js",
  "/js/modules/auth.js",
  "/js/modules/ui.js",
  "/js/modules/validation.js",
  "/js/modules/payment.js",
  "/js/modules/customization.js",
  "/js/modules/checkout.js",
  "/js/modules/user-panel.js",
  "/js/modules/stripe-integration.js",
  "/js/modules/rsvp-system.js",
  "/js/modules/image-upload.js",
  "/js/modules/invitation-generator.js",
  "/js/modules/pwa-service.js",
  "/manifest.json",
  "/favicon.ico",
]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching static files")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("Static files cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Error caching static files:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse
      }

      // Fetch from network and cache
      return fetch(request)
        .then((networkResponse) => {
          // Don't cache non-successful responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse
          }

          // Clone the response
          const responseToCache = networkResponse.clone()

          // Cache dynamic content
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache)
          })

          return networkResponse
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline.html")
          }

          // Return placeholder for images
          if (request.destination === "image") {
            return caches.match("/placeholder.svg")
          }
        })
    }),
  )
})

// Background sync
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)

  if (event.tag === "sync-offline-data") {
    event.waitUntil(syncOfflineData())
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event)

  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || 1,
        url: data.url || "/",
      },
      actions: [
        {
          action: "explore",
          title: "Ver detalles",
          icon: "/images/checkmark.png",
        },
        {
          action: "close",
          title: "Cerrar",
          icon: "/images/xmark.png",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)

  event.notification.close()

  if (event.action === "explore") {
    const url = event.notification.data.url || "/"
    event.waitUntil(clients.openWindow(url))
  }
})

// Message handling
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Sync offline data
async function syncOfflineData() {
  try {
    console.log("Syncing offline data...")

    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData()

    if (offlineData && offlineData.length > 0) {
      for (const item of offlineData) {
        await syncDataItem(item)
      }

      // Clear offline data after successful sync
      await clearOfflineData()

      console.log("Offline data synced successfully")
    }
  } catch (error) {
    console.error("Error syncing offline data:", error)
  }
}

async function getOfflineData() {
  // In a real implementation, this would get data from IndexedDB
  return []
}

async function syncDataItem(item) {
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error("Sync failed")
    }

    console.log("Data item synced:", item.id)
  } catch (error) {
    console.error("Error syncing data item:", error)
    throw error
  }
}

async function clearOfflineData() {
  // Clear offline data storage
  console.log("Clearing offline data...")
}

// Cache management utilities
async function cleanupCaches() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)

  return Promise.all(oldCaches.map((name) => caches.delete(name)))
}

// Preload critical resources
async function preloadCriticalResources() {
  const cache = await caches.open(STATIC_CACHE)
  const criticalResources = ["/css/critical.css", "/js/main.js"]

  return cache.addAll(criticalResources)
}
