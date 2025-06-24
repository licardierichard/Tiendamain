// Enhanced Configuration with Environment Detection - FIXED
export const CONFIG = {
  // Environment Detection
  ENV: (() => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "development"
      } else if (window.location.hostname.includes("staging")) {
        return "staging"
      }
    }
    return "production"
  })(),

  // API Configuration
  API: {
    SUPABASE_URL:
      typeof window !== "undefined"
        ? window.SUPABASE_URL || "https://your-project.supabase.co"
        : "https://your-project.supabase.co",
    SUPABASE_ANON_KEY: typeof window !== "undefined" ? window.SUPABASE_ANON_KEY || "your-anon-key" : "your-anon-key",
    STRIPE_PUBLISHABLE_KEY:
      typeof window !== "undefined"
        ? window.STRIPE_PUBLISHABLE_KEY || "pk_test_your_publishable_key_here"
        : "pk_test_your_publishable_key_here",
  },

  // App Configuration
  APP: {
    NAME: "InviteU.Digital",
    VERSION: "2.0.0",
    DEBUG: false, // Will be set in init()
  },

  // Business Logic
  BUSINESS: {
    PACKAGES: {
      basico: { min: 159, max: 299 },
      intermedio: { min: 299, max: 499 },
      premium: { min: 499, max: 799 },
    },
    TAX_RATE: 0.21,
    CURRENCY: "EUR",
    CURRENCY_SYMBOL: "€",
  },

  // UI Configuration
  UI: {
    SLIDER_INTERVAL: 4000,
    NOTIFICATION_DURATION: 4000,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 16, // 60fps
  },

  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[+]?[\d\s\-()]+$/,
    NAME_MIN_LENGTH: 2,
    MESSAGE_MAX_LENGTH: 1000,
  },

  // Performance Configuration
  PERFORMANCE: {
    LAZY_LOAD_THRESHOLD: "50px",
    IMAGE_QUALITY: 85,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Feature Flags
  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    EMAIL_VERIFICATION: true,
    SOCIAL_LOGIN: false,
    ANALYTICS: true,
    SERVICE_WORKER: true,
  },

  // Error Messages
  MESSAGES: {
    ERRORS: {
      NETWORK: "Error de conexión. Verifica tu internet.",
      VALIDATION: "Por favor, corrige los errores en el formulario.",
      AUTH: "Error de autenticación. Inténtalo de nuevo.",
      PAYMENT: "Error en el pago. Verifica tus datos.",
      GENERIC: "Ha ocurrido un error inesperado.",
    },
    SUCCESS: {
      FORM_SUBMITTED: "Formulario enviado correctamente.",
      USER_REGISTERED: "¡Cuenta creada exitosamente!",
      USER_LOGGED_IN: "¡Bienvenido de vuelta!",
      PAYMENT_SUCCESS: "¡Pago procesado correctamente!",
    },
  },

  // Initialize method for dynamic configuration
  init() {
    // Set debug mode based on environment
    this.APP.DEBUG = this.ENV === "development"

    // Load environment variables if available
    if (typeof window !== "undefined" && window.ENV_CONFIG) {
      Object.assign(this, window.ENV_CONFIG)
    }

    if (this.APP.DEBUG) {
      console.log("🔧 CONFIG loaded:", this)
    }

    return this
  },
}

// Auto-initialize
CONFIG.init()
