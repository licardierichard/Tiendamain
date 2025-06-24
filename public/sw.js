const CACHE_NAME = "inviteu-v2.0.0"
const STATIC_CACHE = "inviteu-static-v2.0.0"
const DYNAMIC_CACHE = "inviteu-dynamic-v2.0.0"

// Archivos críticos para cachear
const STATIC_ASSETS = [
  "/",
  "/crear",
  "/css/critical.css",
  "/css/components.css",
  "/js/main.js",
  "/js/modules/ui.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
]

// Archivos que nunca se deben cachear
const NEVER_CACHE = ["/api/", "/admin/", "/_next/webpack-hmr"]

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("SW: Instalando Service Worker v2.0.0")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("SW: Cacheando archivos estáticos")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("SW: Archivos estáticos cacheados")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("SW: Error cacheando archivos estáticos:", error)
      }),
  )
})

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("SW: Activando Service Worker v2.0.0")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("SW: Eliminando cache antiguo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("SW: Service Worker activado")
        return self.clients.claim()
      }),
  )
})

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // No cachear ciertas rutas
  if (NEVER_CACHE.some((path) => url.pathname.startsWith(path))) {
    return
  }

  // Estrategia Cache First para archivos estáticos
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/css/") ||
    url.pathname.startsWith("/js/")
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          return (
            response ||
            fetch(request).then((fetchResponse) => {
              return caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, fetchResponse.clone())
                return fetchResponse
              })
            })
          )
        })
        .catch(() => {
          // Fallback para páginas offline
          if (request.destination === "document") {
            return caches.match("/offline.html")
          }
        }),
    )
    return
  }

  // Estrategia Network First para contenido dinámico
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match("/offline.html")
          })
        }),
    )
    return
  }

  // Para otros recursos, intentar red primero
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("SW: Push notification recibida")

  const options = {
    body: "Tienes una nueva notificación",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icons/xmark.png",
      },
    ],
  }

  if (event.data) {
    const data = event.data.json()
    options.body = data.body || options.body
    options.title = data.title || "InviteU.Digital"
    options.data = { ...options.data, ...data }
  }

  event.waitUntil(self.registration.showNotification("InviteU.Digital", options))
})

// Manejar clicks en notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("SW: Click en notificación")

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/panel"))
  } else if (event.action === "close") {
    // Solo cerrar la notificación
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(clients.openWindow("/"))
  }
})

// Background sync
self.addEventListener("sync", (event) => {
  console.log("SW: Background sync:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sincronizar datos pendientes
    const pendingData = await getStoredData("pending-sync")
    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await syncDataItem(item)
      }
      await clearStoredData("pending-sync")
    }
  } catch (error) {
    console.error("SW: Error en background sync:", error)
  }
}

// Utilidades para IndexedDB
function getStoredData(key) {
  return new Promise((resolve) => {
    // Implementar lectura de IndexedDB
    resolve([])
  })
}

function clearStoredData(key) {
  return new Promise((resolve) => {
    // Implementar limpieza de IndexedDB
    resolve()
  })
}

function syncDataItem(item) {
  return fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  })
}
