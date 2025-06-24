// Nuevo módulo para gestión de checkout
import { CONFIG } from "../config.js"
import { Utils } from "./utils.js"
import { Data } from "./data.js"

export const Checkout = {
  currentOrder: null,
  initialized: false,

  async init() {
    console.log("💳 Initializing Checkout module...")
    this.setupEventListeners()
    this.initialized = true
  },

  setupEventListeners() {
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "checkoutModal") {
        this.initializeCheckoutModal()
      }
    })
  },

  initializeCheckoutModal() {
    this.loadOrderSummary()
    this.setupPaymentMethods()
    this.setupCheckoutButtons()
  },

  loadOrderSummary() {
    const customization = Utils.getStorage("current_customization")
    if (!customization) return

    const packageData = Data.getPackageById(customization.package)
    if (!packageData) return

    // Calculate totals
    const subtotal = packageData.price.max
    const tax = Math.round(subtotal * CONFIG.BUSINESS.TAX_RATE)
    const total = subtotal + tax

    // Update UI
    const orderDesign = Utils.$("#orderDesign")
    const orderPackage = Utils.$("#orderPackage")
    const orderDetails = Utils.$("#orderDetails")
    const orderPrice = Utils.$("#orderPrice")
    const subtotalEl = Utils.$("#subtotal")
    const taxEl = Utils.$("#tax")
    const totalEl = Utils.$("#total")

    if (orderDesign) orderDesign.textContent = customization.title || "Invitación Personalizada"
    if (orderPackage) orderPackage.textContent = `Paquete ${packageData.name}`
    if (orderDetails) orderDetails.textContent = `${customization.names} - ${Utils.formatDate(customization.date)}`
    if (orderPrice) orderPrice.textContent = Utils.formatPrice(subtotal)
    if (subtotalEl) subtotalEl.textContent = Utils.formatPrice(subtotal)
    if (taxEl) taxEl.textContent = Utils.formatPrice(tax)
    if (totalEl) totalEl.textContent = Utils.formatPrice(total)

    // Store order data
    this.currentOrder = {
      customization,
      package: packageData,
      pricing: { subtotal, tax, total },
    }
  },

  setupPaymentMethods() {
    const paymentMethods = Utils.$$(".payment-method")

    paymentMethods.forEach((method) => {
      method.addEventListener("click", () => {
        // Remove active class from all methods
        paymentMethods.forEach((m) => m.classList.remove("active"))

        // Add active class to clicked method
        method.classList.add("active")

        // Show/hide payment forms
        this.togglePaymentForms(method.dataset.method)
      })
    })
  },

  togglePaymentForms(method) {
    const stripePayment = Utils.$("#stripe-payment")
    const paypalPayment = Utils.$("#paypal-payment")

    if (stripePayment && paypalPayment) {
      if (method === "stripe") {
        stripePayment.style.display = "block"
        paypalPayment.style.display = "none"
      } else {
        stripePayment.style.display = "none"
        paypalPayment.style.display = "block"
      }
    }
  },

  setupCheckoutButtons() {
    const backBtn = Utils.$("#backToCustomization")
    const completeBtn = Utils.$("#completePayment")

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.UI) {
          window.UI.closeModal("checkoutModal")
          window.UI.openModal("customizationModal")
        }
      })
    }

    if (completeBtn) {
      completeBtn.addEventListener("click", () => {
        this.processPayment()
      })
    }
  },

  async processPayment() {
    try {
      if (!window.Auth.isAuthenticated()) {
        if (window.UI) {
          window.UI.showNotification("Debes iniciar sesión para continuar", "warning")
          window.UI.closeModal("checkoutModal")
          window.UI.openModal("loginModal")
        }
        return
      }

      const completeBtn = Utils.$("#completePayment")
      Utils.setLoading(completeBtn, true)

      // Get selected payment method
      const activeMethod = Utils.$(".payment-method.active")
      const method = activeMethod?.dataset.method || "stripe"

      // Process payment
      const result = await this.processPaymentMethod(method)

      Utils.setLoading(completeBtn, false)

      if (result.success) {
        // Save order
        await this.saveOrder(result)

        // Show success
        if (window.UI) {
          window.UI.closeModal("checkoutModal")
          window.UI.showNotification("¡Pago procesado correctamente! Tu invitación estará lista pronto.")
        }

        // Clear customization data
        Utils.removeStorage("current_customization")
      }
    } catch (error) {
      Utils.handleError(error, "processPayment")
      const completeBtn = Utils.$("#completePayment")
      Utils.setLoading(completeBtn, false)
    }
  },

  async processPaymentMethod(method) {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (method === "stripe") {
      return { success: true, paymentMethod: "stripe", transactionId: `stripe_${Date.now()}` }
    } else {
      return { success: true, paymentMethod: "paypal", transactionId: `paypal_${Date.now()}` }
    }
  },

  async saveOrder(paymentResult) {
    const order = {
      id: Date.now().toString(),
      userId: window.Auth.currentUser?.id,
      ...this.currentOrder,
      paymentResult,
      status: "completed",
      createdAt: new Date().toISOString(),
    }

    // Save to localStorage (in production, save to database)
    const orders = Utils.getStorage("user_orders") || []
    orders.push(order)
    Utils.setStorage("user_orders", orders)

    return order
  },
}
