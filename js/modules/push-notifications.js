// Push Notifications System
import { CONFIG } from "../config.js"
import { Utils } from "./utils.js"

export const PushNotifications = {
  initialized: false,
  registration: null,
  subscription: null,
  permission: "default",

  async init() {
    console.log("🔔 Initializing Push Notifications...")

    // Check browser support
    if (!this.isSupported()) {
      console.warn("Push notifications not supported")
      return
    }

    // Get current permission status
    this.permission = Notification.permission

    // Setup service worker registration
    await this.setupServiceWorker()

    // Setup event listeners
    this.setupEventListeners()

    this.initialized = true
    console.log("✅ Push Notifications initialized")
  },

  isSupported() {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  },

  async setupServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.ready
      console.log("Service Worker ready for push notifications")
    } catch (error) {
      console.error("Error setting up service worker:", error)
    }
  },

  setupEventListeners() {
    // Listen for permission requests
    document.addEventListener("requestNotificationPermission", () => {
      this.requestPermission()
    })

    // Listen for subscription requests
    document.addEventListener("subscribeToNotifications", () => {
      this.subscribe()
    })

    // Listen for unsubscription requests
    document.addEventListener("unsubscribeFromNotifications", () => {
      this.unsubscribe()
    })

    // Listen for custom notification events
    document.addEventListener("sendNotification", (e) => {
      this.sendLocalNotification(e.detail)
    })
  },

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission()
      this.permission = permission

      if (permission === "granted") {
        if (window.UI) {
          window.UI.showNotification("¡Notificaciones activadas!")
        }

        // Auto-subscribe after permission granted
        await this.subscribe()
      } else if (permission === "denied") {
        if (window.UI) {
          window.UI.showNotification("Notificaciones bloqueadas", "warning")
        }
      }

      return permission
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return "denied"
    }
  },

  async subscribe() {
    if (!this.registration || this.permission !== "granted") {
      console.warn("Cannot subscribe: no registration or permission denied")
      return null
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription()
      if (existingSubscription) {
        this.subscription = existingSubscription
        console.log("Already subscribed to push notifications")
        return existingSubscription
      }

      // Create new subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.PUSH.VAPID_PUBLIC_KEY),
      })

      this.subscription = subscription

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      if (window.UI) {
        window.UI.showNotification("¡Suscrito a notificaciones!")
      }

      console.log("Subscribed to push notifications:", subscription)
      return subscription
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      if (window.UI) {
        window.UI.showNotification("Error al suscribirse a notificaciones", "error")
      }
      return null
    }
  },

  async unsubscribe() {
    if (!this.subscription) {
      console.warn("No active subscription to unsubscribe from")
      return
    }

    try {
      await this.subscription.unsubscribe()

      // Remove subscription from server
      await this.removeSubscriptionFromServer(this.subscription)

      this.subscription = null

      if (window.UI) {
        window.UI.showNotification("Desuscrito de notificaciones")
      }

      console.log("Unsubscribed from push notifications")
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
    }
  },

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId: window.Auth?.currentUser?.id,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send subscription to server")
      }

      console.log("Subscription sent to server successfully")
    } catch (error) {
      console.error("Error sending subscription to server:", error)
    }
  },

  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId: window.Auth?.currentUser?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove subscription from server")
      }

      console.log("Subscription removed from server successfully")
    } catch (error) {
      console.error("Error removing subscription from server:", error)
    }
  },

  // Send local notification (not push)
  sendLocalNotification(options) {
    if (this.permission !== "granted") {
      console.warn("Cannot send notification: permission not granted")
      return
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      badge: "/favicon.ico",
      image: options.image,
      tag: options.tag || "default",
      renotify: options.renotify || false,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [100, 50, 100],
      data: options.data || {},
      actions: options.actions || [],
    })

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault()

      if (options.url) {
        window.open(options.url, "_blank")
      }

      notification.close()
    }

    // Auto-close after delay
    if (options.autoClose !== false) {
      setTimeout(() => {
        notification.close()
      }, options.duration || 5000)
    }

    return notification
  },

  // Predefined notification types
  notifyRSVPReceived(eventName, guestName) {
    this.sendLocalNotification({
      title: "Nueva confirmación RSVP",
      body: `${guestName} confirmó asistencia a ${eventName}`,
      icon: "/images/rsvp-icon.png",
      tag: "rsvp",
      url: "/panel#rsvp",
    })
  },

  notifyPaymentReceived(amount, eventName) {
    this.sendLocalNotification({
      title: "Pago recibido",
      body: `Pago de €${amount} recibido para ${eventName}`,
      icon: "/images/payment-icon.png",
      tag: "payment",
      url: "/panel#orders",
    })
  },

  notifyInvitationReady(eventName) {
    this.sendLocalNotification({
      title: "Invitación lista",
      body: `Tu invitación para ${eventName} está lista para descargar`,
      icon: "/images/invitation-icon.png",
      tag: "invitation",
      url: "/panel#invitations",
    })
  },

  notifyEventReminder(eventName, timeUntil) {
    this.sendLocalNotification({
      title: "Recordatorio de evento",
      body: `${eventName} es en ${timeUntil}`,
      icon: "/images/reminder-icon.png",
      tag: "reminder",
      requireInteraction: true,
    })
  },

  // Schedule notifications
  scheduleNotification(options, delay) {
    setTimeout(() => {
      this.sendLocalNotification(options)
    }, delay)
  },

  // Batch notifications
  async sendBatchNotifications(notifications) {
    for (const notification of notifications) {
      this.sendLocalNotification(notification)
      // Small delay between notifications
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  },

  // Utility functions
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  },

  // Get subscription status
  async getSubscriptionStatus() {
    if (!this.registration) {
      return {
        supported: this.isSupported(),
        permission: this.permission,
        subscribed: false,
        subscription: null,
      }
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      return {
        supported: this.isSupported(),
        permission: this.permission,
        subscribed: !!subscription,
        subscription,
      }
    } catch (error) {
      console.error("Error getting subscription status:", error)
      return {
        supported: this.isSupported(),
        permission: this.permission,
        subscribed: false,
        subscription: null,
        error: error.message,
      }
    }
  },

  // Test notification
  testNotification() {
    this.sendLocalNotification({
      title: "Notificación de prueba",
      body: "Las notificaciones están funcionando correctamente",
      icon: "/favicon.ico",
      tag: "test",
    })
  },

  // Show notification permission prompt
  showPermissionPrompt() {
    if (this.permission === "default") {
      const promptHTML = `
        <div class="notification-prompt">
          <div class="prompt-content">
            <div class="prompt-icon">🔔</div>
            <h3>Activar Notificaciones</h3>
            <p>Recibe notificaciones sobre confirmaciones RSVP, pagos y recordatorios de eventos.</p>
            <div class="prompt-actions">
              <button class="btn btn-outline" onclick="this.closest('.notification-prompt').remove()">
                Ahora no
              </button>
              <button class="btn btn-primary" onclick="PushNotifications.requestPermission(); this.closest('.notification-prompt').remove()">
                Activar
              </button>
            </div>
          </div>
        </div>
      `

      const promptElement = Utils.createElement("div", {
        innerHTML: promptHTML,
        styles: {
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: "1000",
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          maxWidth: "300px",
        },
      })

      document.body.appendChild(promptElement)

      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (promptElement.parentNode) {
          promptElement.remove()
        }
      }, 10000)
    }
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.PushNotifications = PushNotifications
}
