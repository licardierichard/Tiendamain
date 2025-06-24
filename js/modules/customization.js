import { Utils } from "./utils.js"
import { Data } from "./data.js"

export const Customization = {
  currentDesign: null,
  previewData: {},
  initialized: false,

  async init() {
    console.log("🎨 Initializing Customization module...")
    this.setupEventListeners()
    this.initialized = true
  },

  setupEventListeners() {
    // Listen for customization modal events
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "customizationModal") {
        this.initializeCustomizationForm()
      }
    })
  },

  initializeCustomizationForm() {
    const form = Utils.$("#customizationForm")
    if (!form) return

    // Setup real-time preview
    this.setupRealTimePreview(form)

    // Setup form submission
    this.setupFormSubmission(form)

    // Setup cancel button
    this.setupCancelButton()

    // Setup proceed to checkout
    this.setupProceedToCheckout()
  },

  setupRealTimePreview(form) {
    const inputs = form.querySelectorAll("input, textarea, select")

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.updatePreview()
      })
    })
  },

  updatePreview() {
    const formData = new FormData(Utils.$("#customizationForm"))

    // Update preview elements
    const previewTitle = Utils.$("#previewTitle")
    const previewNames = Utils.$("#previewNames")
    const previewDate = Utils.$("#previewDate")
    const previewTime = Utils.$("#previewTime")
    const previewLocation = Utils.$("#previewLocation")
    const previewMessage = Utils.$("#previewMessage")

    if (previewTitle) previewTitle.textContent = formData.get("event-title") || "Tu Evento Especial"
    if (previewNames) previewNames.textContent = formData.get("names") || "Nombres"
    if (previewDate) previewDate.textContent = formData.get("date") ? Utils.formatDate(formData.get("date")) : "Fecha"
    if (previewTime) previewTime.textContent = formData.get("time") || "Hora"
    if (previewLocation) previewLocation.textContent = formData.get("location") || "Ubicación"
    if (previewMessage) previewMessage.textContent = formData.get("special-message") || "Mensaje especial..."

    // Store preview data
    this.previewData = {
      title: formData.get("event-title"),
      names: formData.get("names"),
      date: formData.get("date"),
      time: formData.get("time"),
      location: formData.get("location"),
      message: formData.get("special-message"),
      package: formData.get("package"),
    }
  },

  setupFormSubmission(form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveCustomization()
    })
  },

  setupCancelButton() {
    const cancelBtn = Utils.$("#cancelCustomization")
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (window.UI) {
          window.UI.closeModal("customizationModal")
        }
      })
    }
  },

  setupProceedToCheckout() {
    const proceedBtn = Utils.$("#proceedToCheckout")
    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        this.proceedToCheckout()
      })
    }
  },

  async saveCustomization() {
    try {
      // Validate required fields
      if (!this.validateCustomization()) {
        return
      }

      // Save to localStorage
      Utils.setStorage("current_customization", this.previewData)

      if (window.UI) {
        window.UI.showNotification("Personalización guardada correctamente")
      }
    } catch (error) {
      Utils.handleError(error, "saveCustomization")
    }
  },

  validateCustomization() {
    const required = ["title", "names", "date", "package"]
    const missing = required.filter((field) => !this.previewData[field])

    if (missing.length > 0) {
      if (window.UI) {
        window.UI.showNotification(`Campos requeridos: ${missing.join(", ")}`, "error")
      }
      return false
    }

    return true
  },

  async proceedToCheckout() {
    try {
      // Save current customization
      await this.saveCustomization()

      // Close customization modal
      if (window.UI) {
        window.UI.closeModal("customizationModal")

        // Open checkout modal
        setTimeout(() => {
          window.UI.openModal("checkoutModal")
        }, 300)
      }
    } catch (error) {
      Utils.handleError(error, "proceedToCheckout")
    }
  },

  openCustomizationModal(eventId) {
    // Load event data
    this.currentDesign = Data.getEventById(eventId)

    if (!this.currentDesign) {
      if (window.UI) {
        window.UI.showNotification("Evento no encontrado", "error")
      }
      return
    }

    // Open modal
    if (window.UI) {
      window.UI.openModal("customizationModal")
    }
  },
}
