// Enhanced Utility Functions with Performance Optimizations - FIXED
import { CONFIG } from "../config.js"

export const Utils = {
  // DOM Utilities with caching
  _cache: new Map(),

  $(selector, useCache = true) {
    if (useCache && this._cache.has(selector)) {
      return this._cache.get(selector)
    }
    const element = document.querySelector(selector)
    if (useCache && element) {
      this._cache.set(selector, element)
    }
    return element
  },

  $$(selector) {
    return document.querySelectorAll(selector)
  },

  createElement(tag, options = {}) {
    const element = document.createElement(tag)

    if (options.className) element.className = options.className
    if (options.id) element.id = options.id
    if (options.innerHTML) element.innerHTML = options.innerHTML
    if (options.textContent) element.textContent = options.textContent

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value)
      })
    }

    if (options.styles) {
      Object.assign(element.style, options.styles)
    }

    return element
  },

  // Clear DOM cache
  clearCache() {
    this._cache.clear()
  },

  // Event Utilities with better performance
  debounce(func, wait, immediate = false) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  },

  throttle(func, limit) {
    let inThrottle
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Enhanced event delegation
  delegate(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e)
      }
    })
  },

  // Validation Utilities
  isValidEmail(email) {
    return CONFIG.VALIDATION.EMAIL_REGEX.test(email)
  },

  isValidPhone(phone) {
    return !phone || CONFIG.VALIDATION.PHONE_REGEX.test(phone)
  },

  isValidName(name) {
    return name && name.trim().length >= CONFIG.VALIDATION.NAME_MIN_LENGTH
  },

  // Format Utilities with internationalization support
  formatDate(dateString, locale = "es-ES") {
    if (!dateString) return "Fecha no disponible"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Fecha inválida"
    }
  },

  formatPrice(price, currency = CONFIG.BUSINESS.CURRENCY) {
    if (typeof price !== "number") return "Precio no disponible"

    try {
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: currency,
      }).format(price)
    } catch (error) {
      console.error("Error formatting price:", error)
      return `${CONFIG.BUSINESS.CURRENCY_SYMBOL}${price}`
    }
  },

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  // Animation Utilities
  scrollToSection(sectionId, offset = 0) {
    const section = this.$(sectionId.startsWith("#") ? sectionId : `#${sectionId}`)
    if (section) {
      const targetPosition = section.offsetTop - offset
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      })
    }
  },

  fadeIn(element, duration = 300) {
    element.style.opacity = 0
    element.style.display = "block"

    const start = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)

      element.style.opacity = progress

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  },

  fadeOut(element, duration = 300) {
    const start = performance.now()
    const startOpacity = Number.parseFloat(getComputedStyle(element).opacity)

    const animate = (currentTime) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)

      element.style.opacity = startOpacity * (1 - progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        element.style.display = "none"
      }
    }

    requestAnimationFrame(animate)
  },

  // Storage Utilities with error handling and compression
  setStorage(key, value, compress = false) {
    try {
      let dataToStore = JSON.stringify(value)

      if (compress && dataToStore.length > 1000) {
        // Simple compression for large data
        dataToStore = this.compress(dataToStore)
      }

      localStorage.setItem(key, dataToStore)
      return true
    } catch (error) {
      console.error("Error saving to localStorage:", error)
      return false
    }
  },

  getStorage(key, decompress = false) {
    try {
      let item = localStorage.getItem(key)
      if (!item) return null

      if (decompress) {
        item = this.decompress(item)
      }

      return JSON.parse(item)
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return null
    }
  },

  removeStorage(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error("Error removing from localStorage:", error)
      return false
    }
  },

  clearStorage() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error("Error clearing localStorage:", error)
      return false
    }
  },

  // Simple compression/decompression (for demo - use proper library in production)
  compress(str) {
    return btoa(encodeURIComponent(str))
  },

  decompress(str) {
    return decodeURIComponent(atob(str))
  },

  // Loading State Utilities
  setLoading(element, isLoading, options = {}) {
    if (!element) return

    const btnText = element.querySelector(".btn-text")
    const spinner = element.querySelector(".loading-spinner")

    if (isLoading) {
      element.disabled = true
      element.classList.add("loading")
      if (btnText) btnText.style.display = "none"
      if (spinner) spinner.style.display = "inline-block"
      if (options.text) element.setAttribute("data-original-text", element.textContent)
      if (options.text) element.textContent = options.text
    } else {
      element.disabled = false
      element.classList.remove("loading")
      if (btnText) btnText.style.display = "inline"
      if (spinner) spinner.style.display = "none"
      if (options.text && element.hasAttribute("data-original-text")) {
        element.textContent = element.getAttribute("data-original-text")
        element.removeAttribute("data-original-text")
      }
    }
  },

  // Enhanced Error Handling
  handleError(error, context = "", options = {}) {
    const errorInfo = {
      message: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack,
    }

    // Log to console in development
    if (CONFIG.APP.DEBUG) {
      console.group(`❌ Error in ${context}`)
      console.error("Error:", error)
      console.table(errorInfo)
      console.groupEnd()
    }

    // Send to error tracking service in production
    if (CONFIG.ENV === "production" && options.track !== false) {
      this.trackError(errorInfo)
    }

    // Show user-friendly message
    const userMessage = this.getUserFriendlyErrorMessage(error)
    if (typeof window !== "undefined" && window.UI && !options.silent) {
      window.UI.showNotification(userMessage, "error")
    }

    return errorInfo
  },

  getUserFriendlyErrorMessage(error) {
    const message = error.message || error

    if (message.includes("network") || message.includes("fetch")) {
      return CONFIG.MESSAGES.ERRORS.NETWORK
    }
    if (message.includes("auth") || message.includes("unauthorized")) {
      return CONFIG.MESSAGES.ERRORS.AUTH
    }
    if (message.includes("payment") || message.includes("stripe")) {
      return CONFIG.MESSAGES.ERRORS.PAYMENT
    }

    return CONFIG.MESSAGES.ERRORS.GENERIC
  },

  trackError(errorInfo) {
    // Implement error tracking (Sentry, LogRocket, etc.)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: errorInfo.message,
        fatal: false,
      })
    }
  },

  // Performance Utilities
  measurePerformance(name, fn) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()

    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  // Device Detection
  getDeviceInfo() {
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      supportsTouch: "ontouchstart" in window,
      supportsServiceWorker: "serviceWorker" in navigator,
      supportsNotifications: "Notification" in window,
    }
  },

  // URL Utilities
  getUrlParams() {
    return new URLSearchParams(window.location.search)
  },

  updateUrlParams(params, replace = false) {
    const url = new URL(window.location)
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, value)
      }
    })

    if (replace) {
      window.history.replaceState({}, "", url)
    } else {
      window.history.pushState({}, "", url)
    }
  },

  // Initialize utilities
  init() {
    console.log("🔧 Utils initialized")

    // Setup global error handling
    if (typeof window !== "undefined") {
      window.addEventListener("error", (e) => {
        this.handleError(e.error, "Global Error")
      })

      // Setup unhandled promise rejection handling
      window.addEventListener("unhandledrejection", (e) => {
        this.handleError(e.reason, "Unhandled Promise Rejection")
      })
    }

    return this
  },
}

// Auto-initialize
Utils.init()
