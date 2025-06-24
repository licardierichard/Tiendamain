// Payment Management
const Payment = {
  stripe: null,
  elements: null,
  card: null,
  currentOrder: null,

  // Initialize Stripe
  async init() {
    if (typeof Stripe !== "undefined" && CONFIG.STRIPE_PUBLISHABLE_KEY) {
      this.stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY)
      this.elements = this.stripe.elements()
      this.setupCard()
    }
  },

  // Setup card element
  setupCard() {
    if (!this.elements) return

    const style = {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    }

    this.card = this.elements.create("card", { style })

    // Mount when checkout modal opens
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "checkoutModal") {
        const cardElement = Utils.$("#card-element")
        if (cardElement && this.card) {
          this.card.mount("#card-element")
          this.setupCardListeners()
        }
      }
    })
  },

  // Setup card event listeners
  setupCardListeners() {
    if (!this.card) return

    this.card.on("change", ({ error }) => {
      const displayError = Utils.$("#card-errors")
      if (displayError) {
        displayError.textContent = error ? error.message : ""
      }
    })
  },

  // Calculate order totals
  calculateTotals(packageType) {
    const packageData = Data.getPackageById(packageType)
    if (!packageData) return null

    const subtotal = packageData.price.max
    const tax = Math.round(subtotal * CONFIG.TAX_RATE)
    const total = subtotal + tax

    return { subtotal, tax, total }
  },

  // Create order
  async createOrder(orderData) {
    try {
      if (!Auth.currentUser) {
        throw new Error("Debes iniciar sesión para realizar un pedido")
      }

      const order = {
        id: Date.now().toString(),
        user_id: Auth.currentUser.id,
        ...orderData,
        status: "pending",
        payment_status: "pending",
        created_at: new Date().toISOString(),
      }

      // Save to localStorage for demo
      const orders = Utils.getStorage("inviteu_orders") || []
      orders.push(order)
      Utils.setStorage("inviteu_orders", orders)

      this.currentOrder = order
      return { success: true, data: order }
    } catch (error) {
      Utils.handleError(error, "createOrder")
      return { success: false, error: error.message }
    }
  },

  // Process Stripe payment
  async processStripePayment() {
    if (!this.stripe || !this.card) {
      throw new Error("Sistema de pago no disponible")
    }

    const { token, error } = await this.stripe.createToken(this.card)

    if (error) {
      throw new Error(error.message)
    }

    // In a real implementation, send token to server
    console.log("Stripe token:", token)

    // Simulate successful payment
    return { success: true, paymentMethod: "stripe", token }
  },

  // Process PayPal payment
  async processPayPalPayment() {
    // Simulate PayPal payment
    console.log("Processing PayPal payment...")

    // In a real implementation, integrate with PayPal SDK
    return { success: true, paymentMethod: "paypal" }
  },

  // Complete payment
  async completePayment(paymentMethod) {
    try {
      let paymentResult

      if (paymentMethod === "stripe") {
        paymentResult = await this.processStripePayment()
      } else if (paymentMethod === "paypal") {
        paymentResult = await this.processPayPalPayment()
      } else {
        throw new Error("Método de pago no válido")
      }

      if (paymentResult.success && this.currentOrder) {
        // Update order status
        const orders = Utils.getStorage("inviteu_orders") || []
        const orderIndex = orders.findIndex((o) => o.id === this.currentOrder.id)

        if (orderIndex !== -1) {
          orders[orderIndex].status = "completed"
          orders[orderIndex].payment_status = "completed"
          orders[orderIndex].payment_method = paymentResult.paymentMethod
          Utils.setStorage("inviteu_orders", orders)
        }

        window.UI.showNotification("¡Pago procesado correctamente!")
        window.UI.closeModal("checkoutModal")

        // Show success message
        setTimeout(() => {
          window.UI.showNotification("¡Pedido confirmado! Puedes ver el estado en tu panel de usuario.")
        }, 1000)

        return { success: true }
      }

      throw new Error("Error procesando el pago")
    } catch (error) {
      Utils.handleError(error, "completePayment")
      return { success: false, error: error.message }
    }
  },

  // Setup payment form listeners
  setupPaymentListeners() {
    // Payment method selection
    Utils.$$(".payment-method").forEach((method) => {
      method.addEventListener("click", () => {
        Utils.$$(".payment-method").forEach((m) => m.classList.remove("active"))
        method.classList.add("active")

        const selectedMethod = method.dataset.method
        const stripePayment = Utils.$("#stripe-payment")
        const paypalPayment = Utils.$("#paypal-payment")

        if (stripePayment && paypalPayment) {
          if (selectedMethod === "stripe") {
            stripePayment.style.display = "block"
            paypalPayment.style.display = "none"
          } else {
            stripePayment.style.display = "none"
            paypalPayment.style.display = "block"
          }
        }
      })
    })

    // Complete payment button
    const completePaymentBtn = Utils.$("#completePayment")
    if (completePaymentBtn) {
      completePaymentBtn.addEventListener("click", async () => {
        const activeMethod = Utils.$(".payment-method.active")
        const method = activeMethod?.dataset.method || "stripe"

        Utils.setLoading(completePaymentBtn, true)

        const result = await this.completePayment(method)

        Utils.setLoading(completePaymentBtn, false)
      })
    }
  },
}

// Make Payment globally available
window.Payment = Payment
