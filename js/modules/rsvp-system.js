// Sistema RSVP Completo
import { Utils } from "./utils.js"
import { Data } from "./data.js"

export const RSVPSystem = {
  initialized: false,
  currentEvent: null,

  async init() {
    console.log("📋 Initializing RSVP System...")
    this.setupEventListeners()
    this.initialized = true
    console.log("✅ RSVP System initialized")
  },

  setupEventListeners() {
    // Listen for RSVP modal events
    document.addEventListener("modalOpened", (e) => {
      if (e.detail.modalId === "rsvpModal") {
        this.initializeRSVPModal()
      }
    })
  },

  openRSVPModal(eventId) {
    this.currentEvent = Data.getEventById(eventId)
    if (!this.currentEvent) {
      if (window.UI) {
        window.UI.showNotification("Evento no encontrado", "error")
      }
      return
    }

    this.createRSVPModal()
  },

  createRSVPModal() {
    const modalHTML = this.getRSVPModalHTML()

    // Remove existing modal
    const existingModal = Utils.$("#rsvpModal")
    if (existingModal) {
      existingModal.remove()
    }

    // Add new modal
    const modalContainer = Utils.$("#modalContainer")
    modalContainer.insertAdjacentHTML("beforeend", modalHTML)

    // Open modal
    if (window.UI) {
      window.UI.openModal("rsvpModal")
    }
  },

  initializeRSVPModal() {
    this.setupRSVPForm()
    this.loadGuestList()
    this.setupGuestManagement()
  },

  setupRSVPForm() {
    const form = Utils.$("#rsvpForm")
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      await this.handleRSVPSubmission(form)
    })

    // Setup guest count selector
    const guestCountSelect = Utils.$("#guestCount")
    if (guestCountSelect) {
      guestCountSelect.addEventListener("change", () => {
        this.updateGuestFields(guestCountSelect.value)
      })
    }
  },

  updateGuestFields(guestCount) {
    const guestFieldsContainer = Utils.$("#guestFields")
    if (!guestFieldsContainer) return

    let fieldsHTML = ""
    for (let i = 1; i <= guestCount; i++) {
      fieldsHTML += `
        <div class="guest-field">
          <label for="guest${i}Name">Invitado ${i} - Nombre *</label>
          <input type="text" id="guest${i}Name" name="guest${i}Name" required>
          
          <label for="guest${i}Email">Email</label>
          <input type="email" id="guest${i}Email" name="guest${i}Email">
          
          <label for="guest${i}Dietary">Restricciones Alimentarias</label>
          <input type="text" id="guest${i}Dietary" name="guest${i}Dietary" placeholder="Vegetariano, sin gluten, etc.">
        </div>
      `
    }

    guestFieldsContainer.innerHTML = fieldsHTML
  },

  async handleRSVPSubmission(form) {
    try {
      const submitBtn = form.querySelector('button[type="submit"]')
      Utils.setLoading(submitBtn, true)

      const formData = new FormData(form)
      const rsvpData = this.extractRSVPData(formData)

      // Validate RSVP data
      if (!this.validateRSVPData(rsvpData)) {
        return
      }

      // Save RSVP
      await this.saveRSVP(rsvpData)

      // Send confirmation
      await this.sendRSVPConfirmation(rsvpData)

      Utils.setLoading(submitBtn, false)

      if (window.UI) {
        window.UI.showNotification("¡RSVP enviado correctamente!")
        window.UI.closeModal("rsvpModal")
      }

      // Refresh guest list
      this.loadGuestList()
    } catch (error) {
      Utils.handleError(error, "handleRSVPSubmission")
      const submitBtn = form.querySelector('button[type="submit"]')
      Utils.setLoading(submitBtn, false)
    }
  },

  extractRSVPData(formData) {
    const guestCount = Number.parseInt(formData.get("guestCount"))
    const guests = []

    for (let i = 1; i <= guestCount; i++) {
      const guest = {
        name: formData.get(`guest${i}Name`),
        email: formData.get(`guest${i}Email`),
        dietary: formData.get(`guest${i}Dietary`) || "",
      }
      if (guest.name) {
        guests.push(guest)
      }
    }

    return {
      eventId: this.currentEvent.id,
      primaryContact: {
        name: formData.get("contactName"),
        email: formData.get("contactEmail"),
        phone: formData.get("contactPhone"),
      },
      attending: formData.get("attending") === "yes",
      guestCount: guests.length,
      guests,
      message: formData.get("message") || "",
      submittedAt: new Date().toISOString(),
    }
  },

  validateRSVPData(rsvpData) {
    if (!rsvpData.primaryContact.name || !rsvpData.primaryContact.email) {
      if (window.UI) {
        window.UI.showNotification("Nombre y email de contacto son requeridos", "error")
      }
      return false
    }

    if (rsvpData.attending && rsvpData.guests.length === 0) {
      if (window.UI) {
        window.UI.showNotification("Debe agregar al menos un invitado", "error")
      }
      return false
    }

    return true
  },

  async saveRSVP(rsvpData) {
    try {
      // Generate RSVP ID
      rsvpData.id = `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Get existing RSVPs
      const rsvps = Utils.getStorage("event_rsvps") || []

      // Check for duplicate
      const existingIndex = rsvps.findIndex(
        (r) => r.eventId === rsvpData.eventId && r.primaryContact.email === rsvpData.primaryContact.email,
      )

      if (existingIndex !== -1) {
        // Update existing RSVP
        rsvps[existingIndex] = { ...rsvps[existingIndex], ...rsvpData }
      } else {
        // Add new RSVP
        rsvps.push(rsvpData)
      }

      Utils.setStorage("event_rsvps", rsvps)
      return rsvpData
    } catch (error) {
      console.error("Error saving RSVP:", error)
      throw error
    }
  },

  async sendRSVPConfirmation(rsvpData) {
    try {
      // In production, this would call your backend
      const emailData = {
        to: rsvpData.primaryContact.email,
        subject: `Confirmación RSVP - ${this.currentEvent.name}`,
        template: "rsvp_confirmation",
        data: {
          eventName: this.currentEvent.name,
          contactName: rsvpData.primaryContact.name,
          attending: rsvpData.attending,
          guestCount: rsvpData.guestCount,
          guests: rsvpData.guests,
        },
      }

      // Simulate email sending
      console.log("Sending RSVP confirmation email:", emailData)

      // In production:
      // await fetch("/api/send-email", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(emailData)
      // })
    } catch (error) {
      console.error("Error sending RSVP confirmation:", error)
    }
  },

  loadGuestList() {
    const guestListContainer = Utils.$("#guestList")
    if (!guestListContainer || !this.currentEvent) return

    const rsvps = Utils.getStorage("event_rsvps") || []
    const eventRSVPs = rsvps.filter((r) => r.eventId === this.currentEvent.id)

    const stats = this.calculateRSVPStats(eventRSVPs)
    const guestListHTML = this.generateGuestListHTML(eventRSVPs, stats)

    guestListContainer.innerHTML = guestListHTML
  },

  calculateRSVPStats(rsvps) {
    const attending = rsvps.filter((r) => r.attending)
    const notAttending = rsvps.filter((r) => !r.attending)
    const totalGuests = attending.reduce((sum, r) => sum + r.guestCount, 0)

    return {
      totalRSVPs: rsvps.length,
      attending: attending.length,
      notAttending: notAttending.length,
      totalGuests,
      responseRate: rsvps.length > 0 ? ((rsvps.length / 100) * 100).toFixed(1) : 0,
    }
  },

  generateGuestListHTML(rsvps, stats) {
    return `
      <div class="rsvp-stats">
        <h4>Estadísticas RSVP</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">${stats.totalRSVPs}</span>
            <span class="stat-label">Respuestas</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${stats.attending}</span>
            <span class="stat-label">Asistirán</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${stats.notAttending}</span>
            <span class="stat-label">No Asistirán</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${stats.totalGuests}</span>
            <span class="stat-label">Total Invitados</span>
          </div>
        </div>
      </div>

      <div class="guest-list">
        <h4>Lista de Invitados</h4>
        ${
          rsvps.length > 0
            ? rsvps
                .map(
                  (rsvp) => `
          <div class="guest-item ${rsvp.attending ? "attending" : "not-attending"}">
            <div class="guest-info">
              <h5>${rsvp.primaryContact.name}</h5>
              <p>${rsvp.primaryContact.email}</p>
              <p class="guest-status">
                ${rsvp.attending ? `Asistirá (${rsvp.guestCount} personas)` : "No asistirá"}
              </p>
              ${rsvp.message ? `<p class="guest-message">"${rsvp.message}"</p>` : ""}
            </div>
            <div class="guest-actions">
              <button class="btn btn-sm btn-outline" onclick="RSVPSystem.editRSVP('${rsvp.id}')">
                Editar
              </button>
              <button class="btn btn-sm btn-danger" onclick="RSVPSystem.deleteRSVP('${rsvp.id}')">
                Eliminar
              </button>
            </div>
          </div>
        `,
                )
                .join("")
            : "<p>No hay respuestas RSVP aún.</p>"
        }
      </div>
    `
  },

  setupGuestManagement() {
    // Export guest list functionality
    const exportBtn = Utils.$("#exportGuestList")
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportGuestList()
      })
    }

    // Send reminders functionality
    const reminderBtn = Utils.$("#sendReminders")
    if (reminderBtn) {
      reminderBtn.addEventListener("click", () => {
        this.sendReminders()
      })
    }
  },

  exportGuestList() {
    const rsvps = Utils.getStorage("event_rsvps") || []
    const eventRSVPs = rsvps.filter((r) => r.eventId === this.currentEvent.id)

    if (eventRSVPs.length === 0) {
      if (window.UI) {
        window.UI.showNotification("No hay datos para exportar", "warning")
      }
      return
    }

    // Create CSV content
    const csvContent = this.generateCSV(eventRSVPs)

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rsvp_${this.currentEvent.name}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    if (window.UI) {
      window.UI.showNotification("Lista de invitados exportada correctamente")
    }
  },

  generateCSV(rsvps) {
    const headers = [
      "Nombre",
      "Email",
      "Teléfono",
      "Asistirá",
      "Número de Invitados",
      "Invitados",
      "Restricciones",
      "Mensaje",
      "Fecha Respuesta",
    ]

    const rows = rsvps.map((rsvp) => [
      rsvp.primaryContact.name,
      rsvp.primaryContact.email,
      rsvp.primaryContact.phone || "",
      rsvp.attending ? "Sí" : "No",
      rsvp.guestCount,
      rsvp.guests.map((g) => g.name).join("; "),
      rsvp.guests
        .map((g) => g.dietary)
        .filter((d) => d)
        .join("; "),
      rsvp.message || "",
      new Date(rsvp.submittedAt).toLocaleDateString(),
    ])

    return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")
  },

  async sendReminders() {
    try {
      // In production, this would call your backend
      if (window.UI) {
        window.UI.showNotification("Enviando recordatorios... (función en desarrollo)")
      }

      // Simulate sending reminders
      console.log("Sending RSVP reminders for event:", this.currentEvent.id)
    } catch (error) {
      Utils.handleError(error, "sendReminders")
    }
  },

  editRSVP(rsvpId) {
    if (window.UI) {
      window.UI.showNotification("Función de edición en desarrollo")
    }
  },

  deleteRSVP(rsvpId) {
    if (confirm("¿Estás seguro de que quieres eliminar esta respuesta RSVP?")) {
      try {
        const rsvps = Utils.getStorage("event_rsvps") || []
        const filteredRSVPs = rsvps.filter((r) => r.id !== rsvpId)
        Utils.setStorage("event_rsvps", filteredRSVPs)

        this.loadGuestList()

        if (window.UI) {
          window.UI.showNotification("RSVP eliminado correctamente")
        }
      } catch (error) {
        Utils.handleError(error, "deleteRSVP")
      }
    }
  },

  getRSVPModalHTML() {
    return `
      <div id="rsvpModal" class="modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Gestión RSVP - ${this.currentEvent?.name || "Evento"}</h2>
            <button class="close-modal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="rsvp-content">
              <div class="rsvp-form-section">
                <h3>Nuevo RSVP</h3>
                <form id="rsvpForm" class="rsvp-form">
                  <div class="form-group">
                    <label for="contactName">Nombre de Contacto *</label>
                    <input type="text" id="contactName" name="contactName" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="contactEmail">Email de Contacto *</label>
                    <input type="email" id="contactEmail" name="contactEmail" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="contactPhone">Teléfono</label>
                    <input type="tel" id="contactPhone" name="contactPhone">
                  </div>
                  
                  <div class="form-group">
                    <label>¿Asistirás al evento?</label>
                    <div class="radio-group">
                      <label class="radio-label">
                        <input type="radio" name="attending" value="yes" required>
                        <span>Sí, asistiré</span>
                      </label>
                      <label class="radio-label">
                        <input type="radio" name="attending" value="no" required>
                        <span>No podré asistir</span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="guestCount">Número de Invitados</label>
                    <select id="guestCount" name="guestCount">
                      <option value="1">1 persona</option>
                      <option value="2">2 personas</option>
                      <option value="3">3 personas</option>
                      <option value="4">4 personas</option>
                      <option value="5">5 personas</option>
                      <option value="6">6+ personas</option>
                    </select>
                  </div>
                  
                  <div id="guestFields" class="guest-fields">
                    <!-- Guest fields will be populated dynamically -->
                  </div>
                  
                  <div class="form-group">
                    <label for="message">Mensaje (opcional)</label>
                    <textarea id="message" name="message" rows="3" placeholder="Mensaje para los anfitriones..."></textarea>
                  </div>
                  
                  <button type="submit" class="btn btn-primary">
                    <span class="btn-text">Enviar RSVP</span>
                    <span class="loading-spinner" style="display: none;"></span>
                  </button>
                </form>
              </div>
              
              <div class="guest-list-section">
                <div class="guest-list-header">
                  <h3>Lista de Invitados</h3>
                  <div class="guest-actions">
                    <button id="exportGuestList" class="btn btn-outline btn-sm">
                      Exportar Lista
                    </button>
                    <button id="sendReminders" class="btn btn-primary btn-sm">
                      Enviar Recordatorios
                    </button>
                  </div>
                </div>
                <div id="guestList">
                  <!-- Guest list will be populated dynamically -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.RSVPSystem = RSVPSystem
}
