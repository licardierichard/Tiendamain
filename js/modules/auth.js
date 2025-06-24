// Enhanced Authentication Management with Security Improvements - FIXED
import { CONFIG } from "../config.js"
import { Utils } from "./utils.js"

export const Auth = {
  currentUser: null,
  supabase: null,
  initialized: false,

  // Security configuration
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    passwordMinLength: 8,
  },

  // Login attempt tracking
  loginAttempts: new Map(),

  // Initialize authentication system
  async init() {
    try {
      console.log("🔐 Initializing Auth module...")

      // Initialize Supabase if available
      await this.initializeSupabase()

      // Setup event listeners
      this.setupEventListeners()

      // Check existing session
      await this.checkExistingSession()

      // Setup session monitoring
      this.setupSessionMonitoring()

      this.initialized = true
      console.log("✅ Auth module initialized")
    } catch (error) {
      console.error("❌ Auth initialization failed:", error)
      // Fallback to localStorage mode
      this.initializeFallbackMode()
    }
  },

  // Initialize Supabase connection
  async initializeSupabase() {
    if (typeof window !== "undefined" && window.supabase && CONFIG.API.SUPABASE_URL) {
      try {
        this.supabase = window.supabase.createClient(CONFIG.API.SUPABASE_URL, CONFIG.API.SUPABASE_ANON_KEY)

        // Setup auth state listener
        this.supabase.auth.onAuthStateChange((event, session) => {
          this.handleAuthStateChange(event, session)
        })

        console.log("✅ Supabase initialized")
      } catch (error) {
        console.warn("⚠️ Supabase initialization failed, using fallback:", error)
        this.supabase = null
      }
    }
  },

  // Initialize fallback localStorage mode
  initializeFallbackMode() {
    console.log("📱 Using localStorage fallback mode")
    this.loadUserFromStorage()
  },

  // Handle authentication state changes
  async handleAuthStateChange(event, session) {
    try {
      if (event === "SIGNED_IN" && session) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split("@")[0],
          phone: session.user.user_metadata?.phone || "",
          email_verified: session.user.email_confirmed_at !== null,
          avatar: session.user.user_metadata?.avatar_url || null,
          created_at: session.user.created_at,
          last_sign_in: session.user.last_sign_in_at,
        }

        // Save to localStorage for persistence
        this.saveUserToStorage()

        // Update UI
        if (window.UI) {
          window.UI.updateAuthUI(this.currentUser)
        }

        // Show verification prompt if needed
        if (!this.currentUser.email_verified && CONFIG.FEATURES.EMAIL_VERIFICATION) {
          this.showEmailVerificationPrompt()
        }

        // Setup push notifications
        if (CONFIG.FEATURES.PUSH_NOTIFICATIONS) {
          this.setupPushNotifications()
        }

        // Track login event
        this.trackAuthEvent("login", { method: "email" })
      } else if (event === "SIGNED_OUT") {
        this.currentUser = null
        this.removeUserFromStorage()

        if (window.UI) {
          window.UI.updateAuthUI(null)
        }

        // Track logout event
        this.trackAuthEvent("logout")
      }
    } catch (error) {
      console.error("Error handling auth state change:", error)
    }
  },

  // Check for existing session
  async checkExistingSession() {
    if (this.supabase) {
      try {
        const {
          data: { session },
          error,
        } = await this.supabase.auth.getSession()
        if (error) throw error

        if (session) {
          this.handleAuthStateChange("SIGNED_IN", session)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        this.loadUserFromStorage()
      }
    } else {
      this.loadUserFromStorage()
    }
  },

  // Register new user
  async register(userData) {
    try {
      // Validate input
      this.validateRegistrationData(userData)

      if (this.supabase) {
        const { data, error } = await this.supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              phone: userData.phone,
            },
          },
        })

        if (error) throw error

        if (window.UI) {
          window.UI.showNotification(CONFIG.MESSAGES.SUCCESS.USER_REGISTERED)
        }

        // Track registration event
        this.trackAuthEvent("register", { method: "email" })

        return { success: true, data }
      } else {
        // Fallback registration
        return this.registerFallback(userData)
      }
    } catch (error) {
      const errorMessage = this.getAuthErrorMessage(error)
      if (window.UI) {
        window.UI.showNotification(errorMessage, "error")
      }
      return { success: false, error: errorMessage }
    }
  },

  // Fallback registration for localStorage mode
  registerFallback(userData) {
    const users = Utils.getStorage("inviteu_users") || []

    // Check if user exists
    if (users.find((u) => u.email === userData.email)) {
      throw new Error("El usuario ya existe")
    }

    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      email_verified: false,
      created_at: new Date().toISOString(),
      avatar: null,
    }

    users.push(newUser)
    Utils.setStorage("inviteu_users", users)

    this.currentUser = newUser
    this.saveUserToStorage()

    if (window.UI) {
      window.UI.updateAuthUI(this.currentUser)
      window.UI.showNotification(CONFIG.MESSAGES.SUCCESS.USER_REGISTERED)
    }

    return { success: true, data: newUser }
  },

  // Login user
  async login(email, password) {
    try {
      // Check for rate limiting
      if (this.isRateLimited(email)) {
        throw new Error("Demasiados intentos de inicio de sesión. Inténtalo más tarde.")
      }

      // Validate input
      this.validateLoginData(email, password)

      if (this.supabase) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          this.recordFailedLogin(email)
          throw error
        }

        // Clear failed attempts on success
        this.clearFailedLogins(email)

        if (window.UI) {
          window.UI.showNotification(CONFIG.MESSAGES.SUCCESS.USER_LOGGED_IN)
        }

        return { success: true, data }
      } else {
        // Fallback login
        return this.loginFallback(email, password)
      }
    } catch (error) {
      const errorMessage = this.getAuthErrorMessage(error)
      if (window.UI) {
        window.UI.showNotification(errorMessage, "error")
      }
      return { success: false, error: errorMessage }
    }
  },

  // Fallback login for localStorage mode
  loginFallback(email, password) {
    const users = Utils.getStorage("inviteu_users") || []
    const user = users.find((u) => u.email === email)

    if (!user) {
      this.recordFailedLogin(email)
      throw new Error("Usuario no encontrado")
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, we'll just check if password exists
    if (!password || password.length < this.security.passwordMinLength) {
      this.recordFailedLogin(email)
      throw new Error("Contraseña incorrecta")
    }

    this.clearFailedLogins(email)
    this.currentUser = user
    this.saveUserToStorage()

    if (window.UI) {
      window.UI.updateAuthUI(this.currentUser)
      window.UI.showNotification(CONFIG.MESSAGES.SUCCESS.USER_LOGGED_IN)
    }

    return { success: true, data: user }
  },

  // Logout user
  async logout() {
    try {
      if (this.supabase) {
        const { error } = await this.supabase.auth.signOut()
        if (error) throw error
      } else {
        this.currentUser = null
        this.removeUserFromStorage()
        if (window.UI) {
          window.UI.updateAuthUI(null)
        }
      }

      if (window.UI) {
        window.UI.showNotification("Sesión cerrada correctamente")
      }

      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, error: error.message }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      if (!Utils.isValidEmail(email)) {
        throw new Error("Email inválido")
      }

      if (this.supabase) {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error
      }

      if (window.UI) {
        window.UI.showNotification("Email de recuperación enviado. Revisa tu bandeja de entrada.")
      }

      return { success: true }
    } catch (error) {
      const errorMessage = this.getAuthErrorMessage(error)
      if (window.UI) {
        window.UI.showNotification(errorMessage, "error")
      }
      return { success: false, error: errorMessage }
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error("Usuario no autenticado")
      }

      if (this.supabase) {
        const { data, error } = await this.supabase.auth.updateUser({
          data: updates,
        })

        if (error) throw error

        // Update current user object
        this.currentUser = {
          ...this.currentUser,
          ...updates,
        }
      } else {
        // Fallback update
        this.currentUser = {
          ...this.currentUser,
          ...updates,
        }
      }

      this.saveUserToStorage()

      if (window.UI) {
        window.UI.updateAuthUI(this.currentUser)
        window.UI.showNotification("Perfil actualizado correctamente")
      }

      return { success: true, data: this.currentUser }
    } catch (error) {
      const errorMessage = this.getAuthErrorMessage(error)
      if (window.UI) {
        window.UI.showNotification(errorMessage, "error")
      }
      return { success: false, error: errorMessage }
    }
  },

  // Rate limiting methods
  isRateLimited(email) {
    const attempts = this.loginAttempts.get(email)
    if (!attempts) return false

    const { count, lastAttempt } = attempts
    const timeSinceLastAttempt = Date.now() - lastAttempt

    if (timeSinceLastAttempt > this.security.lockoutDuration) {
      this.loginAttempts.delete(email)
      return false
    }

    return count >= this.security.maxLoginAttempts
  },

  recordFailedLogin(email) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 }
    attempts.count++
    attempts.lastAttempt = Date.now()
    this.loginAttempts.set(email, attempts)
  },

  clearFailedLogins(email) {
    this.loginAttempts.delete(email)
  },

  // Validation methods
  validateRegistrationData(userData) {
    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres")
    }

    if (!Utils.isValidEmail(userData.email)) {
      throw new Error("Email inválido")
    }

    if (!userData.password || userData.password.length < this.security.passwordMinLength) {
      throw new Error(`La contraseña debe tener al menos ${this.security.passwordMinLength} caracteres`)
    }

    if (userData.phone && !Utils.isValidPhone(userData.phone)) {
      throw new Error("Teléfono inválido")
    }
  },

  validateLoginData(email, password) {
    if (!Utils.isValidEmail(email)) {
      throw new Error("Email inválido")
    }

    if (!password) {
      throw new Error("Contraseña requerida")
    }
  },

  // Error message mapping
  getAuthErrorMessage(error) {
    const message = error.message || error

    if (message.includes("Invalid login credentials")) {
      return "Credenciales incorrectas"
    }
    if (message.includes("Email not confirmed")) {
      return "Por favor verifica tu email antes de continuar"
    }
    if (message.includes("User already registered")) {
      return "El usuario ya está registrado"
    }
    if (message.includes("Password should be at least")) {
      return `La contraseña debe tener al menos ${this.security.passwordMinLength} caracteres`
    }
    if (message.includes("Unable to validate email address")) {
      return "Email inválido"
    }
    if (message.includes("Signup is disabled")) {
      return "El registro está temporalmente deshabilitado"
    }

    return message
  },

  // Storage methods
  saveUserToStorage() {
    if (this.currentUser) {
      Utils.setStorage("inviteu_current_user", this.currentUser)
    }
  },

  loadUserFromStorage() {
    const user = Utils.getStorage("inviteu_current_user")
    if (user) {
      this.currentUser = user
      if (window.UI) {
        window.UI.updateAuthUI(this.currentUser)
      }
    }
  },

  removeUserFromStorage() {
    Utils.removeStorage("inviteu_current_user")
  },

  // Session monitoring
  setupSessionMonitoring() {
    // Check session validity periodically
    setInterval(
      () => {
        if (this.currentUser && this.supabase) {
          this.validateSession()
        }
      },
      5 * 60 * 1000,
    ) // Check every 5 minutes

    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.currentUser) {
        this.validateSession()
      }
    })
  },

  async validateSession() {
    try {
      if (this.supabase) {
        const {
          data: { session },
          error,
        } = await this.supabase.auth.getSession()
        if (error || !session) {
          this.handleSessionExpired()
        }
      }
    } catch (error) {
      console.error("Session validation error:", error)
      this.handleSessionExpired()
    }
  },

  handleSessionExpired() {
    this.currentUser = null
    this.removeUserFromStorage()

    if (window.UI) {
      window.UI.updateAuthUI(null)
      window.UI.showNotification("Tu sesión ha expirado. Por favor inicia sesión nuevamente.", "warning")
    }
  },

  // Email verification
  showEmailVerificationPrompt() {
    if (window.UI && this.currentUser && !this.currentUser.email_verified) {
      setTimeout(() => {
        window.UI.showNotification("Por favor verifica tu email para acceder a todas las funciones", "warning")
      }, 2000)
    }
  },

  async resendVerificationEmail() {
    try {
      if (!this.currentUser) {
        throw new Error("Usuario no autenticado")
      }

      if (this.supabase) {
        const { error } = await this.supabase.auth.resend({
          type: "signup",
          email: this.currentUser.email,
        })

        if (error) throw error
      }

      if (window.UI) {
        window.UI.showNotification("Email de verificación reenviado")
      }

      return { success: true }
    } catch (error) {
      const errorMessage = this.getAuthErrorMessage(error)
      if (window.UI) {
        window.UI.showNotification(errorMessage, "error")
      }
      return { success: false, error: errorMessage }
    }
  },

  // Push notifications setup
  async setupPushNotifications() {
    if (!this.currentUser || !CONFIG.FEATURES.PUSH_NOTIFICATIONS) return

    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.register("/service-worker.js")

        if (window.notificationService) {
          await window.notificationService.subscribeUser(this.currentUser.id)
        }
      }
    } catch (error) {
      console.error("Push notification setup error:", error)
    }
  },

  // Analytics tracking
  trackAuthEvent(event, properties = {}) {
    if (CONFIG.FEATURES.ANALYTICS && window.gtag) {
      window.gtag("event", event, {
        event_category: "auth",
        ...properties,
      })
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupAuthButtons())
    } else {
      this.setupAuthButtons()
    }

    // Setup form listeners when modals are opened
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "loginModal") {
        this.setupLoginForm()
      } else if (e.detail.modalId === "registerModal") {
        this.setupRegisterForm()
      }
    })
  },

  setupAuthButtons() {
    // Auth buttons
    const loginBtn = Utils.$("#loginBtn")
    const registerBtn = Utils.$("#registerBtn")
    const logoutBtn = Utils.$("#logoutBtn")

    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        if (window.UI) {
          window.UI.openModal("loginModal")
        }
      })
    }

    if (registerBtn) {
      registerBtn.addEventListener("click", () => {
        if (window.UI) {
          window.UI.openModal("registerModal")
        }
      })
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout())
    }
  },

  // Setup login form
  setupLoginForm() {
    const loginForm = Utils.$("#loginForm")
    if (!loginForm) return

    const validationRules = {
      email: [{ type: "required" }, { type: "email" }],
      password: [{ type: "required" }],
    }

    if (window.Validation) {
      window.Validation.setupValidation(loginForm, validationRules)
    }

    // Remove existing listeners
    const newForm = loginForm.cloneNode(true)
    loginForm.parentNode.replaceChild(newForm, loginForm)

    newForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      if (window.Validation && !window.Validation.validateForm(newForm, validationRules)) return

      const submitBtn = newForm.querySelector('button[type="submit"]')
      Utils.setLoading(submitBtn, true)

      const formData = new FormData(newForm)
      const result = await this.login(formData.get("email"), formData.get("password"))

      Utils.setLoading(submitBtn, false)

      if (result.success && window.UI) {
        window.UI.closeModal("loginModal")
        newForm.reset()
      }
    })
  },

  // Setup register form
  setupRegisterForm() {
    const registerForm = Utils.$("#registerForm")
    if (!registerForm) return

    const validationRules = {
      name: [{ type: "required" }],
      email: [{ type: "required" }, { type: "email" }],
      phone: [{ type: "phone" }],
      password: [{ type: "required" }, { type: "minLength", value: this.security.passwordMinLength }],
      confirmPassword: [{ type: "required" }, { type: "match", field: "#registerPassword" }],
    }

    if (window.Validation) {
      window.Validation.setupValidation(registerForm, validationRules)
    }

    // Remove existing listeners
    const newForm = registerForm.cloneNode(true)
    registerForm.parentNode.replaceChild(newForm, registerForm)

    newForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      if (window.Validation && !window.Validation.validateForm(newForm, validationRules)) return

      const submitBtn = newForm.querySelector('button[type="submit"]')
      Utils.setLoading(submitBtn, true)

      const formData = new FormData(newForm)
      const result = await this.register({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
      })

      Utils.setLoading(submitBtn, false)

      if (result.success && window.UI) {
        window.UI.closeModal("registerModal")
        newForm.reset()
      }
    })
  },

  // Public API methods
  isAuthenticated() {
    return !!this.currentUser
  },

  getCurrentUser() {
    return this.currentUser
  },

  hasPermission(permission) {
    if (!this.currentUser) return false

    // Basic permission system
    const permissions = this.currentUser.permissions || []
    return permissions.includes(permission) || permissions.includes("admin")
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      if (window.UI) {
        window.UI.showNotification("Debes iniciar sesión para continuar", "warning")
        window.UI.openModal("loginModal")
      }
      return false
    }
    return true
  },
}
