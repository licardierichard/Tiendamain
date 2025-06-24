// Main Application Bundle - Updated with new modules
import { CONFIG } from "./config.js"
import { Utils } from "./modules/utils.js"
import { Data } from "./modules/data.js"
import { Auth } from "./modules/auth.js"
import { UI } from "./modules/ui.js"
import { Validation } from "./modules/validation.js"
import { Payment } from "./modules/payment.js"
import { Customization } from "./modules/customization.js"
import { Checkout } from "./modules/checkout.js"
import { UserPanel } from "./modules/user-panel.js"

// Application Class - Updated
class InviteUApp {
  constructor() {
    this.modules = {
      config: CONFIG,
      utils: Utils,
      data: Data,
      auth: Auth,
      ui: UI,
      validation: Validation,
      payment: Payment,
      customization: Customization,
      checkout: Checkout,
      userPanel: UserPanel,
    }

    this.initialized = false
    this.performance = {
      startTime: performance.now(),
      loadTime: null,
      renderTime: null,
    }
  }

  // Initialize application with performance monitoring
  async init() {
    try {
      console.log("🚀 Initializing InviteU.Digital...")

      // Mark initialization start
      this.performance.initStart = performance.now()

      // Make modules globally available for backward compatibility
      this.exposeGlobals()

      // Initialize modules in optimal order
      await this.initializeModules()

      // Setup global event listeners
      this.setupGlobalListeners()

      // Setup performance monitoring
      this.setupPerformanceMonitoring()

      // Mark app as loaded
      this.markAsLoaded()

      // Calculate performance metrics
      this.calculatePerformanceMetrics()

      this.initialized = true
      console.log("✅ InviteU.Digital initialized successfully!", this.performance)
    } catch (error) {
      console.error("❌ Error initializing application:", error)
      this.handleInitializationError(error)
    }
  }

  // Expose modules globally for backward compatibility
  exposeGlobals() {
    if (typeof window !== "undefined") {
      window.CONFIG = this.modules.config
      window.Utils = this.modules.utils
      window.Data = this.modules.data
      window.Auth = this.modules.auth
      window.UI = this.modules.ui
      window.Validation = this.modules.validation
      window.Payment = this.modules.payment
      window.Customization = this.modules.customization
      window.Checkout = this.modules.checkout
      window.UserPanel = this.modules.userPanel
    }
  }

  // Initialize modules in dependency order - UPDATED
  async initializeModules() {
    const initOrder = [
      "utils", // First - needed by all others
      "data", // Second - provides data to other modules
      "validation", // Third - needed by forms
      "ui", // Fourth - sets up interface
      "auth", // Fifth - depends on UI
      "payment", // Sixth - depends on auth and UI
      "customization", // Seventh - depends on UI and Data
      "checkout", // Eighth - depends on customization and payment
      "userPanel", // Last - depends on auth and UI
    ]

    for (const moduleName of initOrder) {
      const module = this.modules[moduleName]
      if (module && typeof module.init === "function") {
        console.log(`Initializing ${moduleName}...`)
        await module.init()
      }
    }
  }

  // Setup global event listeners
  setupGlobalListeners() {
    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.modules.ui.closeAllModals()
      }
    })

    // Scroll handling with throttling
    window.addEventListener(
      "scroll",
      this.modules.utils.throttle(() => {
        const navbar = document.getElementById("navbar")
        if (navbar) {
          navbar.classList.toggle("scrolled", window.scrollY > 10)
        }
      }, 16), // 60fps
    )

    // Global error handling
    window.addEventListener("error", (e) => {
      console.error("Global error:", e.error)
      this.modules.ui.showNotification("Ha ocurrido un error inesperado", "error")
    })

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (e) => {
      console.error("Unhandled promise rejection:", e.reason)
      this.modules.ui.showNotification("Error de conexión", "error")
    })

    // Global scroll to section function
    window.scrollToSection = (sectionId) => {
      this.modules.utils.scrollToSection(sectionId)
    }
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ("web-vital" in window) {
      import("https://unpkg.com/web-vitals@3/dist/web-vitals.js")
        .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log)
          getFID(console.log)
          getFCP(console.log)
          getLCP(console.log)
          getTTFB(console.log)
        })
        .catch((error) => {
          console.warn("Web Vitals not available:", error)
        })
    }

    // Monitor resource loading
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              console.log("Navigation timing:", entry)
            }
          }
        })
        observer.observe({ entryTypes: ["navigation"] })
      } catch (error) {
        console.warn("Performance Observer not supported:", error)
      }
    }
  }

  // Mark application as loaded
  markAsLoaded() {
    document.body.classList.remove("loading")
    document.body.classList.add("loaded")

    // Trigger custom event
    document.dispatchEvent(
      new CustomEvent("appLoaded", {
        detail: { performance: this.performance },
      }),
    )
  }

  // Calculate performance metrics
  calculatePerformanceMetrics() {
    this.performance.loadTime = performance.now() - this.performance.startTime
    this.performance.renderTime = performance.now() - this.performance.initStart

    // Log performance metrics
    console.log("📊 Performance Metrics:", {
      "Total Load Time": `${this.performance.loadTime.toFixed(2)}ms`,
      "Render Time": `${this.performance.renderTime.toFixed(2)}ms`,
      "Memory Usage": `${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` || "N/A",
    })
  }

  // Handle initialization errors
  handleInitializationError(error) {
    document.body.classList.add("error")

    // Show user-friendly error message
    const errorContainer = document.createElement("div")
    errorContainer.className = "init-error"
    errorContainer.innerHTML = `
      <div class="error-content">
        <h2>Error de Carga</h2>
        <p>Ha ocurrido un problema al cargar la aplicación. Por favor, recarga la página.</p>
        <button onclick="window.location.reload()" class="btn btn-primary">Recargar</button>
      </div>
    `
    errorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
      text-align: center;
    `
    document.body.appendChild(errorContainer)
  }

  // Public API for external access
  getModule(name) {
    return this.modules[name]
  }

  // Health check
  isHealthy() {
    return (
      this.initialized && Object.values(this.modules).every((module) => !module.init || module.initialized !== false)
    )
  }
}

// Initialize app when DOM is ready
const app = new InviteUApp()

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init())
} else {
  app.init()
}

// Make app globally available for debugging
if (typeof window !== "undefined") {
  window.InviteUApp = app
}

// Export for module usage
export default app
