// Main Application Entry Point
const App = {
  // Initialize the application
  async init() {
    try {
      console.log("Initializing InviteU.Digital application...")

      // Initialize core modules in order
      await this.initializeModules()

      // Setup global event listeners
      this.setupGlobalListeners()

      // Mark app as loaded
      document.body.classList.add("loaded")

      console.log("InviteU.Digital application initialized successfully! 🎉")
    } catch (error) {
      console.error("Error initializing application:", error)
      Utils.handleError(error, "App initialization")
    }
  },

  // Initialize all modules
  async initializeModules() {
    // Initialize UI first
    if (window.UI) {
      window.UI.init()
    }

    // Initialize Auth
    if (window.Auth) {
      await window.Auth.init()
    }

    // Initialize Payment
    if (window.Payment) {
      await window.Payment.init()
    }
  },

  // Setup global event listeners
  setupGlobalListeners() {
    // Keyboard navigation support
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (window.UI) {
          window.UI.closeAllModals()
        }
      }
    })

    // Handle window scroll for navbar
    window.addEventListener(
      "scroll",
      Utils.debounce(() => {
        const navbar = Utils.$("#navbar")
        if (navbar) {
          if (window.scrollY > 10) {
            navbar.classList.add("scrolled")
          } else {
            navbar.classList.remove("scrolled")
          }
        }
      }, 10),
    )

    // Global click handler for scroll to section
    window.scrollToSection = (sectionId) => {
      Utils.scrollToSection(sectionId)
    }
  },
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init())
} else {
  App.init()
}

// Make App globally available
window.App = App
