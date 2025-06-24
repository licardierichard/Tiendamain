// Integración Real con Stripe
import { CONFIG } from "../config.js"
import { Utils } from "./utils.js"

export const StripeIntegration = {
  stripe: null,
  elements: null,
  card: null,
  paymentIntent: null,
  initialized: false,

  async init() {
    console.log("💳 Initializing Stripe Integration...")

    if (typeof window.Stripe === "undefined") {
      console.warn("Stripe.js not loaded")
      return
    }

    try {
      this.stripe = window.Stripe(CONFIG.API.STRIPE_PUBLISHABLE_KEY)
      this.elements = this.stripe.elements({
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#ec4899",
            colorBackground: "#ffffff",
            colorText: "#30313d",
            colorDanger: "#df1b41",
            fontFamily: "Ideal Sans, system-ui, sans-serif",
            spacingUnit: "2px",
            borderRadius: "4px",
          },
        },
      })

      this.setupEventListeners()
      this.initialized = true
      console.log("✅ Stripe Integration initialized")
    } catch (error) {
      console.error("❌ Stripe initialization failed:", error)
    }
  },

  setupEventListeners() {
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "checkoutModal") {
        setTimeout(() => this.mountPaymentElement(), 100)
      }
    })
  },

  async mountPaymentElement() {
    const paymentElementContainer = Utils.$("#payment-element")
    if (!paymentElementContainer || !this.elements) return

    try {
      // Create payment intent
      await this.createPaymentIntent()

      // Create and mount payment element
      const paymentElement = this.elements.create("payment", {
        layout: "tabs",
      })

      paymentElement.mount("#payment-element")

      paymentElement.on("change", (event) => {
        this.handlePaymentElementChange(event)
      })

      this.paymentElement = paymentElement
    } catch (error) {
      console.error("Error mounting payment element:", error)
      this.showPaymentError("Error al cargar el formulario de pago")
    }
  },

  async createPaymentIntent() {
    try {
      const orderData = Utils.getStorage("current_order")
      if (!orderData) throw new Error("No order data found")

      // In production, this would call your backend
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: orderData.pricing.total * 100, // Stripe expects cents
          currency: "eur",
          metadata: {
            orderId: orderData.id,
            userId: window.Auth.currentUser?.id,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment intent")
      }

      const { client_secret } = await response.json()
      this.paymentIntent = { client_secret }

      return this.paymentIntent
    } catch (error) {
      console.error("Error creating payment intent:", error)
      // Fallback for demo
      this.paymentIntent = {
        client_secret: `pi_demo_${Date.now()}_secret_demo`,
      }
      return this.paymentIntent
    }
  },

  handlePaymentElementChange(event) {
    const errorElement = Utils.$("#payment-errors")
    if (errorElement) {
      errorElement.textContent = event.error ? event.error.message : ""
    }
  },

  async processPayment() {
    if (!this.stripe || !this.paymentElement) {
      throw new Error("Stripe not initialized")
    }

    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent.status === "succeeded") {
        return {
          success: true,
          paymentIntent,
          paymentMethod: "stripe",
        }
      } else {
        throw new Error("Payment not completed")
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      throw error
    }
  },

  showPaymentError(message) {
    const errorElement = Utils.$("#payment-errors")
    if (errorElement) {
      errorElement.textContent = message
      errorElement.style.color = "#df1b41"
    }
  },

  // Webhook handler for payment confirmation
  async handleWebhook(event) {
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSuccess(event.data.object)
        break
      case "payment_intent.payment_failed":
        await this.handlePaymentFailure(event.data.object)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  },

  async handlePaymentSuccess(paymentIntent) {
    const orderId = paymentIntent.metadata.orderId
    if (orderId) {
      await this.updateOrderStatus(orderId, "completed")
      await this.sendConfirmationEmail(orderId)
    }
  },

  async handlePaymentFailure(paymentIntent) {
    const orderId = paymentIntent.metadata.orderId
    if (orderId) {
      await this.updateOrderStatus(orderId, "failed")
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      const orders = Utils.getStorage("user_orders") || []
      const orderIndex = orders.findIndex((o) => o.id === orderId)

      if (orderIndex !== -1) {
        orders[orderIndex].status = status
        orders[orderIndex].updatedAt = new Date().toISOString()
        Utils.setStorage("user_orders", orders)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  },

  async sendConfirmationEmail(orderId) {
    try {
      // In production, this would call your backend
      await fetch("/api/send-confirmation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })
    } catch (error) {
      console.error("Error sending confirmation email:", error)
    }
  },
}
