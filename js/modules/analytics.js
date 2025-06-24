// Analytics and Tracking System
import { CONFIG } from "../config.js"
import { Utils } from "./utils.js"

export const Analytics = {
  initialized: false,
  sessionId: null,
  userId: null,
  events: [],

  async init() {
    console.log("📊 Initializing Analytics...")

    // Generate session ID
    this.sessionId = this.generateSessionId()

    // Setup tracking
    this.setupEventTracking()
    this.setupPerformanceTracking()
    this.setupErrorTracking()
    this.setupUserTracking()

    // Initialize external analytics
    await this.initializeExternalAnalytics()

    this.initialized = true
    console.log("✅ Analytics initialized")
  },

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  setupEventTracking() {
    // Track page views
    this.trackPageView()

    // Track user interactions
    document.addEventListener("click", (e) => {
      this.trackClick(e)
    })

    // Track form submissions
    document.addEventListener("submit", (e) => {
      this.trackFormSubmission(e)
    })

    // Track scroll depth
    this.setupScrollTracking()

    // Track time on page
    this.setupTimeTracking()
  },

  setupPerformanceTracking() {
    // Track Core Web Vitals
    if ("PerformanceObserver" in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackEvent("performance", "lcp", {
            value: entry.startTime,
            element: entry.element?.tagName,
          })
        }
      }).observe({ entryTypes: ["largest-contentful-paint"] })

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackEvent("performance", "fid", {
            value: entry.processingStart - entry.startTime,
            eventType: entry.name,
          })
        }
      }).observe({ entryTypes: ["first-input"] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        if (clsValue > 0) {
          this.trackEvent("performance", "cls", {
            value: clsValue,
          })
        }
      }).observe({ entryTypes: ["layout-shift"] })
    }

    // Track page load time
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0]
        if (navigation) {
          this.trackEvent("performance", "page_load", {
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstByte: navigation.responseStart - navigation.fetchStart,
          })
        }
      }, 0)
    })
  },

  setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener("error", (e) => {
      this.trackEvent("error", "javascript", {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
      })
    })

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (e) => {
      this.trackEvent("error", "promise_rejection", {
        reason: e.reason?.toString(),
        stack: e.reason?.stack,
      })
    })

    // Track network errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          this.trackEvent("error", "network", {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
          })
        }
        return response
      } catch (error) {
        this.trackEvent("error", "network", {
          url: args[0],
          message: error.message,
        })
        throw error
      }
    }
  },

  setupUserTracking() {
    // Track user authentication
    document.addEventListener("userLoggedIn", (e) => {
      this.userId = e.detail.userId
      this.trackEvent("user", "login", {
        method: e.detail.method,
      })
    })

    document.addEventListener("userLoggedOut", () => {
      this.trackEvent("user", "logout")
      this.userId = null
    })

    // Track user registration
    document.addEventListener("userRegistered", (e) => {
      this.trackEvent("user", "register", {
        method: e.detail.method,
      })
    })
  },

  setupScrollTracking() {
    let maxScroll = 0
    const trackScroll = Utils.throttle(() => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
      )

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent

        // Track scroll milestones
        if (scrollPercent >= 25 && maxScroll < 25) {
          this.trackEvent("engagement", "scroll", { depth: 25 })
        } else if (scrollPercent >= 50 && maxScroll < 50) {
          this.trackEvent("engagement", "scroll", { depth: 50 })
        } else if (scrollPercent >= 75 && maxScroll < 75) {
          this.trackEvent("engagement", "scroll", { depth: 75 })
        } else if (scrollPercent >= 90 && maxScroll < 90) {
          this.trackEvent("engagement", "scroll", { depth: 90 })
        }
      }
    }, 250)

    window.addEventListener("scroll", trackScroll)
  },

  setupTimeTracking() {
    const startTime = Date.now()

    // Track time on page when user leaves
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime
      this.trackEvent("engagement", "time_on_page", {
        duration: timeOnPage,
        durationSeconds: Math.round(timeOnPage / 1000),
      })
    }

    window.addEventListener("beforeunload", trackTimeOnPage)
    window.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        trackTimeOnPage()
      }
    })
  },

  trackPageView(page = window.location.pathname) {
    this.trackEvent("navigation", "page_view", {
      page,
      title: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    })
  },

  trackClick(event) {
    const element = event.target
    const tagName = element.tagName.toLowerCase()

    // Track button clicks
    if (tagName === "button" || element.classList.contains("btn")) {
      this.trackEvent("interaction", "button_click", {
        text: element.textContent?.trim(),
        className: element.className,
        id: element.id,
      })
    }

    // Track link clicks
    if (tagName === "a") {
      this.trackEvent("interaction", "link_click", {
        href: element.href,
        text: element.textContent?.trim(),
        external: !element.href.startsWith(window.location.origin),
      })
    }

    // Track specific UI elements
    if (element.classList.contains("event-card")) {
      this.trackEvent("interaction", "event_card_click", {
        eventId: element.dataset.design,
        category: element.dataset.category,
      })
    }

    if (element.classList.contains("package-btn")) {
      this.trackEvent("interaction", "package_select", {
        package: element.dataset.package,
      })
    }
  },

  trackFormSubmission(event) {
    const form = event.target
    const formId = form.id || form.className

    this.trackEvent("interaction", "form_submit", {
      formId,
      action: form.action,
      method: form.method,
    })
  },

  trackEvent(category, action, data = {}) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      category,
      action,
      data: {
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    }

    // Store event
    this.events.push(event)

    // Send to external analytics
    this.sendToExternalAnalytics(event)

    // Store locally for offline sync
    this.storeEventLocally(event)

    // Log in development
    if (CONFIG.APP.DEBUG) {
      console.log("📊 Analytics Event:", event)
    }
  },

  async initializeExternalAnalytics() {
    // Initialize Google Analytics
    if (CONFIG.FEATURES.ANALYTICS && window.gtag) {
      window.gtag("config", "GA_MEASUREMENT_ID", {
        session_id: this.sessionId,
        user_id: this.userId,
      })
    }

    // Initialize other analytics services
    // Facebook Pixel, Mixpanel, etc.
  },

  sendToExternalAnalytics(event) {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category: event.category,
        event_label: JSON.stringify(event.data),
        custom_map: {
          session_id: this.sessionId,
          user_id: this.userId,
        },
      })
    }

    // Send to custom analytics endpoint
    if (navigator.onLine) {
      this.sendToServer(event)
    }
  },

  async sendToServer(event) {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error("Error sending analytics event:", error)
      // Store for retry
      this.storeEventLocally(event)
    }
  },

  storeEventLocally(event) {
    const storedEvents = Utils.getStorage("analytics_events") || []
    storedEvents.push(event)

    // Keep only last 100 events
    if (storedEvents.length > 100) {
      storedEvents.splice(0, storedEvents.length - 100)
    }

    Utils.setStorage("analytics_events", storedEvents)
  },

  async syncStoredEvents() {
    const storedEvents = Utils.getStorage("analytics_events") || []

    if (storedEvents.length > 0 && navigator.onLine) {
      try {
        await fetch("/api/analytics/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ events: storedEvents }),
        })

        // Clear stored events after successful sync
        Utils.removeStorage("analytics_events")
        console.log("Analytics events synced successfully")
      } catch (error) {
        console.error("Error syncing analytics events:", error)
      }
    }
  },

  // Business-specific tracking methods
  trackEventSelection(eventType, design) {
    this.trackEvent("business", "event_selection", {
      eventType,
      design,
    })
  },

  trackCustomization(step, data) {
    this.trackEvent("business", "customization", {
      step,
      ...data,
    })
  },

  trackPurchase(orderData) {
    this.trackEvent("business", "purchase", {
      orderId: orderData.id,
      amount: orderData.pricing.total,
      currency: "EUR",
      items: orderData.items?.map((item) => ({
        name: item.name,
        category: item.category,
        price: item.price,
      })),
    })
  },

  trackRSVP(eventId, attending) {
    this.trackEvent("business", "rsvp", {
      eventId,
      attending,
    })
  },

  trackInvitationGenerated(templateId, format) {
    this.trackEvent("business", "invitation_generated", {
      templateId,
      format,
    })
  },

  trackInvitationShared(method) {
    this.trackEvent("business", "invitation_shared", {
      method,
    })
  },

  // Get analytics data
  getEvents(category = null, limit = 100) {
    let events = [...this.events]

    if (category) {
      events = events.filter((e) => e.category === category)
    }

    return events.slice(-limit)
  },

  getSessionData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.events[0]?.timestamp,
      eventCount: this.events.length,
      categories: [...new Set(this.events.map((e) => e.category))],
    }
  },

  // Generate analytics report
  generateReport(timeframe = "24h") {
    const now = new Date()
    const timeframeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }

    const cutoff = new Date(now.getTime() - timeframeMs[timeframe])
    const recentEvents = this.events.filter((e) => new Date(e.timestamp) > cutoff)

    const report = {
      timeframe,
      totalEvents: recentEvents.length,
      categories: {},
      topActions: {},
      errors: recentEvents.filter((e) => e.category === "error").length,
      performance: {
        avgLoadTime: 0,
        avgLCP: 0,
        avgFID: 0,
        avgCLS: 0,
      },
    }

    // Group by category
    recentEvents.forEach((event) => {
      if (!report.categories[event.category]) {
        report.categories[event.category] = 0
      }
      report.categories[event.category]++

      if (!report.topActions[event.action]) {
        report.topActions[event.action] = 0
      }
      report.topActions[event.action]++
    })

    // Calculate performance metrics
    const perfEvents = recentEvents.filter((e) => e.category === "performance")
    if (perfEvents.length > 0) {
      const loadTimes = perfEvents.filter((e) => e.action === "page_load").map((e) => e.data.loadTime)
      const lcpValues = perfEvents.filter((e) => e.action === "lcp").map((e) => e.data.value)
      const fidValues = perfEvents.filter((e) => e.action === "fid").map((e) => e.data.value)
      const clsValues = perfEvents.filter((e) => e.action === "cls").map((e) => e.data.value)

      report.performance.avgLoadTime =
        loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0
      report.performance.avgLCP = lcpValues.length > 0 ? lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length : 0
      report.performance.avgFID = fidValues.length > 0 ? fidValues.reduce((a, b) => a + b, 0) / fidValues.length : 0
      report.performance.avgCLS = clsValues.length > 0 ? clsValues.reduce((a, b) => a + b, 0) / clsValues.length : 0
    }

    return report
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.Analytics = Analytics
}
