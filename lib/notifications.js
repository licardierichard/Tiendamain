// Push notification service
export const notificationService = {
  async requestPermission() {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  },

  async showNotification(title, options = {}) {
    const hasPermission = await this.requestPermission()

    if (hasPermission) {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  },

  async subscribeUser(userId) {
    // Register service worker for push notifications
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY),
        })

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription, userId)
        return subscription
      } catch (error) {
        console.error("Error subscribing to push notifications:", error)
      }
    }
  },

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

  async sendSubscriptionToServer(subscription, userId) {
    // This would typically send to your backend
    console.log("Subscription data:", { subscription, userId })
  },
}
