import { Utils } from "./utils.js"

export const PWAService = {
  initialized: false,
  deferredPrompt: null,
  isInstalled: false,

  async init() {
    console.log("📱 Initializing PWA Service...")

    // Register service worker
    await this.registerServiceWorker()

    // Setup install prompt
    this.setupInstallPrompt()

    // Check if already installed
    this.checkInstallStatus()

    // Setup offline detection
    this.setupOfflineDetection()

    this.initialized = true
    console.log("✅ PWA Service initialized")
  },

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js")
        console.log("Service Worker registered:", registration)

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              this.showUpdateAvailable()
            }
          })
        })

        return registration
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }
  },

  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.showInstallButton()
    })

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true
      this.hideInstallButton()
      if (window.UI) {
        window.UI.showNotification("¡App instalada correctamente!")
      }
    })
  },

  checkInstallStatus() {
    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      this.isInstalled = true
    }
  },

  setupOfflineDetection() {
    window.addEventListener("online", () => {
      if (window.UI) {
        window.UI.showNotification("Conexión restaurada", "success")
      }
      this.syncOfflineData()
    })

    window.addEventListener("offline", () => {
      if (window.UI) {
        window.UI.showNotification("Sin conexión - Modo offline activado", "warning")
      }
    })
  },

  showInstallButton() {
    // Create install button if it doesn't exist
    let installBtn = Utils.$("#installPWABtn")

    if (!installBtn) {
      installBtn = Utils.createElement("button", {
        id: "installPWABtn",
        className: "install-pwa-btn",
        innerHTML: `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          Instalar App
        `,
        styles: {
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "linear-gradient(to right, #ec4899, #a855f7)",
          color: "white",
          border: "none",
          borderRadius: "25px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          zIndex: "1000",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        },
      })

      installBtn.addEventListener("click", () => this.installApp())
      document.body.appendChild(installBtn)
    }

    installBtn.style.display = "flex"
  },

  hideInstallButton() {
    const installBtn = Utils.$("#installPWABtn")
    if (installBtn) {
      installBtn.style.display = "none"
    }
  },

  async installApp() {
    if (!this.deferredPrompt) return

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
      } else {
        console.log("User dismissed the install prompt")
      }

      this.deferredPrompt = null
      this.hideInstallButton()
    } catch (error) {
      console.error("Error installing app:", error)
    }
  },

  showUpdateAvailable() {
    if (window.UI) {
      const updateNotification = Utils.createElement("div", {
        className: "update-notification",
        innerHTML: `
          <div class="update-content">
            <span>Nueva versión disponible</span>
            <button class="btn btn-sm btn-primary" onclick="PWAService.updateApp()">
              Actualizar
            </button>
          </div>
        `,
        styles: {
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#3b82f6",
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          zIndex: "1001",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        },
      })

      document.body.appendChild(updateNotification)

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (updateNotification.parentNode) {
          updateNotification.remove()
        }
      }, 10000)
    }
  },

  async updateApp() {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
        window.location.reload()
      }
    } catch (error) {
      console.error("Error updating app:", error)
    }
  },

  async syncOfflineData() {
    try {
      // Sync any offline data when connection is restored
      const offlineData = Utils.getStorage("offline_data")
      if (offlineData && offlineData.length > 0) {
        console.log("Syncing offline data:", offlineData)

        // Process offline data
        for (const item of offlineData) {
          await this.processOfflineItem(item)
        }

        // Clear offline data after sync
        Utils.removeStorage("offline_data")

        if (window.UI) {
          window.UI.showNotification("Datos sincronizados correctamente")
        }
      }
    } catch (error) {
      console.error("Error syncing offline data:", error)
    }
  },

  async processOfflineItem(item) {
    // Process different types of offline data
    switch (item.type) {
      case "rsvp":
        // Sync RSVP data
        break
      case "order":
        // Sync order data
        break
      case "contact":
        // Sync contact form data
        break
      default:
        console.log("Unknown offline item type:", item.type)
    }
  },

  // Store data for offline sync
  storeOfflineData(type, data) {
    const offlineData = Utils.getStorage("offline_data") || []
    offlineData.push({
      type,
      data,
      timestamp: new Date().toISOString(),
    })
    Utils.setStorage("offline_data", offlineData)
  },

  // Check if app is running offline
  isOffline() {
    return !navigator.onLine
  },

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      isOffline: this.isOffline(),
      hasServiceWorker: "serviceWorker" in navigator,
      canInstall: !!this.deferredPrompt,
    }
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.PWAService = PWAService
}
