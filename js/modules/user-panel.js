import { Utils } from "./utils.js"
import { Data } from "./data.js"

export const UserPanel = {
  initialized: false,

  async init() {
    console.log("👤 Initializing UserPanel module...")
    this.setupEventListeners()
    this.initialized = true
  },

  setupEventListeners() {
    // User panel button
    const userPanelBtn = Utils.$("#userPanelBtn")
    if (userPanelBtn) {
      userPanelBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.openUserPanel()
      })
    }

    // My orders button
    const myOrdersBtn = Utils.$("#myOrdersBtn")
    if (myOrdersBtn) {
      myOrdersBtn.addEventListener("click", (e) => {
        e.preventDefault()
        this.openUserPanel("orders")
      })
    }
  },

  openUserPanel(section = "dashboard") {
    if (!window.Auth.isAuthenticated()) {
      if (window.UI) {
        window.UI.showNotification("Debes iniciar sesión para acceder al panel", "warning")
        window.UI.openModal("loginModal")
      }
      return
    }

    this.createUserPanelModal(section)
  },

  createUserPanelModal(activeSection) {
    const modalHTML = this.getUserPanelHTML(activeSection)

    // Remove existing modal
    const existingModal = Utils.$("#userPanelModal")
    if (existingModal) {
      existingModal.remove()
    }

    // Add new modal
    const modalContainer = Utils.$("#modalContainer")
    modalContainer.insertAdjacentHTML("beforeend", modalHTML)

    // Setup modal
    this.setupUserPanelModal(activeSection)

    // Open modal
    if (window.UI) {
      window.UI.openModal("userPanelModal")
    }
  },

  setupUserPanelModal(activeSection) {
    const modal = Utils.$("#userPanelModal")

    // Setup close button
    const closeBtn = modal.querySelector(".close-modal")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (window.UI) {
          window.UI.closeModal("userPanelModal")
        }
      })
    }

    // Setup navigation
    this.setupPanelNavigation(activeSection)

    // Load initial content
    this.loadPanelContent(activeSection)
  },

  setupPanelNavigation(activeSection) {
    const navButtons = Utils.$$(".panel-nav-btn")

    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const section = btn.dataset.section

        // Update active button
        navButtons.forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")

        // Load content
        this.loadPanelContent(section)
      })
    })

    // Set initial active button
    const activeBtn = Utils.$(`[data-section="${activeSection}"]`)
    if (activeBtn) {
      activeBtn.classList.add("active")
    }
  },

  loadPanelContent(section) {
    const contentArea = Utils.$("#panelContent")
    if (!contentArea) return

    let content = ""

    switch (section) {
      case "dashboard":
        content = this.getDashboardContent()
        break
      case "orders":
        content = this.getOrdersContent()
        break
      case "profile":
        content = this.getProfileContent()
        break
      case "settings":
        content = this.getSettingsContent()
        break
      default:
        content = this.getDashboardContent()
    }

    contentArea.innerHTML = content
    this.setupSectionListeners(section)
  },

  getDashboardContent() {
    const user = window.Auth.currentUser
    const orders = Utils.getStorage("user_orders") || []
    const recentOrders = orders.slice(-3)

    return `
      <div class="dashboard-content">
        <h3>Bienvenido, ${user?.name || "Usuario"}</h3>
        <div class="dashboard-stats">
          <div class="stat-card">
            <h4>Total de Pedidos</h4>
            <span class="stat-number">${orders.length}</span>
          </div>
          <div class="stat-card">
            <h4>Invitaciones Activas</h4>
            <span class="stat-number">${orders.filter((o) => o.status === "completed").length}</span>
          </div>
          <div class="stat-card">
            <h4>Próximos Eventos</h4>
            <span class="stat-number">${this.getUpcomingEvents(orders)}</span>
          </div>
        </div>
        
        <div class="recent-orders">
          <h4>Pedidos Recientes</h4>
          ${
            recentOrders.length > 0
              ? recentOrders
                  .map(
                    (order) => `
              <div class="order-item">
                <div class="order-info">
                  <h5>${order.customization?.title || "Invitación"}</h5>
                  <p>${Utils.formatDate(order.createdAt)}</p>
                </div>
                <div class="order-status ${order.status}">
                  ${Data.getStatusText(order.status)}
                </div>
              </div>
            `,
                  )
                  .join("")
              : "<p>No tienes pedidos recientes</p>"
          }
        </div>
      </div>
    `
  },

  getOrdersContent() {
    const orders = Utils.getStorage("user_orders") || []

    return `
      <div class="orders-content">
        <h3>Mis Pedidos</h3>
        ${
          orders.length > 0
            ? `<div class="orders-list">
            ${orders
              .map(
                (order) => `
              <div class="order-card">
                <div class="order-header">
                  <h4>${order.customization?.title || "Invitación"}</h4>
                  <span class="order-status ${order.status}">
                    ${Data.getStatusText(order.status)}
                  </span>
                </div>
                <div class="order-details">
                  <p><strong>Paquete:</strong> ${order.package?.name}</p>
                  <p><strong>Fecha del evento:</strong> ${Utils.formatDate(order.customization?.date)}</p>
                  <p><strong>Total:</strong> ${Utils.formatPrice(order.pricing?.total)}</p>
                  <p><strong>Pedido:</strong> ${Utils.formatDate(order.createdAt)}</p>
                </div>
                <div class="order-actions">
                  <button class="btn btn-outline btn-sm" onclick="UserPanel.downloadInvitation('${order.id}')">
                    Descargar
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="UserPanel.viewInvitation('${order.id}')">
                    Ver Invitación
                  </button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>`
            : "<p>No tienes pedidos aún. <a href='#eventos'>¡Crea tu primera invitación!</a></p>"
        }
      </div>
    `
  },

  getProfileContent() {
    const user = window.Auth.currentUser

    return `
      <div class="profile-content">
        <h3>Mi Perfil</h3>
        <form id="profileForm" class="profile-form">
          <div class="form-group">
            <label for="profileName">Nombre Completo</label>
            <input type="text" id="profileName" name="name" value="${user?.name || ""}" required>
          </div>
          <div class="form-group">
            <label for="profileEmail">Email</label>
            <input type="email" id="profileEmail" name="email" value="${user?.email || ""}" required readonly>
          </div>
          <div class="form-group">
            <label for="profilePhone">Teléfono</label>
            <input type="tel" id="profilePhone" name="phone" value="${user?.phone || ""}">
          </div>
          <button type="submit" class="btn btn-primary">
            <span class="btn-text">Actualizar Perfil</span>
            <span class="loading-spinner" style="display: none;"></span>
          </button>
        </form>
      </div>
    `
  },

  getSettingsContent() {
    return `
      <div class="settings-content">
        <h3>Configuración</h3>
        <div class="settings-section">
          <h4>Notificaciones</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" id="emailNotifications" checked>
              <span>Recibir notificaciones por email</span>
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" id="pushNotifications">
              <span>Notificaciones push</span>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Privacidad</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" id="profilePublic">
              <span>Perfil público</span>
            </label>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Cuenta</h4>
          <button class="btn btn-outline" onclick="UserPanel.changePassword()">
            Cambiar Contraseña
          </button>
          <button class="btn btn-danger" onclick="UserPanel.deleteAccount()">
            Eliminar Cuenta
          </button>
        </div>
      </div>
    `
  },

  setupSectionListeners(section) {
    if (section === "profile") {
      this.setupProfileForm()
    } else if (section === "settings") {
      this.setupSettingsForm()
    }
  },

  setupProfileForm() {
    const form = Utils.$("#profileForm")
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const submitBtn = form.querySelector('button[type="submit"]')
      Utils.setLoading(submitBtn, true)

      const formData = new FormData(form)
      const updates = {
        name: formData.get("name"),
        phone: formData.get("phone"),
      }

      const result = await window.Auth.updateProfile(updates)

      Utils.setLoading(submitBtn, false)

      if (result.success) {
        if (window.UI) {
          window.UI.showNotification("Perfil actualizado correctamente")
        }
      }
    })
  },

  setupSettingsForm() {
    // Setup settings listeners
    const emailNotifications = Utils.$("#emailNotifications")
    const pushNotifications = Utils.$("#pushNotifications")

    if (emailNotifications) {
      emailNotifications.addEventListener("change", () => {
        this.updateSetting("emailNotifications", emailNotifications.checked)
      })
    }

    if (pushNotifications) {
      pushNotifications.addEventListener("change", () => {
        this.updateSetting("pushNotifications", pushNotifications.checked)
      })
    }
  },

  updateSetting(key, value) {
    const settings = Utils.getStorage("user_settings") || {}
    settings[key] = value
    Utils.setStorage("user_settings", settings)

    if (window.UI) {
      window.UI.showNotification("Configuración actualizada")
    }
  },

  getUpcomingEvents(orders) {
    const now = new Date()
    return orders.filter((order) => {
      if (!order.customization?.date) return false
      const eventDate = new Date(order.customization.date)
      return eventDate > now
    }).length
  },

  downloadInvitation(orderId) {
    if (window.UI) {
      window.UI.showNotification("Descarga iniciada... (función en desarrollo)")
    }
  },

  viewInvitation(orderId) {
    if (window.UI) {
      window.UI.showNotification("Abriendo vista previa... (función en desarrollo)")
    }
  },

  changePassword() {
    if (window.UI) {
      window.UI.showNotification("Función de cambio de contraseña en desarrollo")
    }
  },

  deleteAccount() {
    if (confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      if (window.UI) {
        window.UI.showNotification("Función de eliminación de cuenta en desarrollo")
      }
    }
  },

  getUserPanelHTML(activeSection) {
    return `
      <div id="userPanelModal" class="modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Panel de Usuario</h2>
            <button class="close-modal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="user-panel-content">
              <div class="user-panel-sidebar">
                <div class="user-info">
                  <div class="user-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h3>${window.Auth.currentUser?.name || "Usuario"}</h3>
                  <p>${window.Auth.currentUser?.email || ""}</p>
                </div>
                <nav class="panel-nav">
                  <button class="panel-nav-btn" data-section="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Dashboard
                  </button>
                  <button class="panel-nav-btn" data-section="orders">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                    Mis Pedidos
                  </button>
                  <button class="panel-nav-btn" data-section="profile">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Mi Perfil
                  </button>
                  <button class="panel-nav-btn" data-section="settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                    Configuración
                  </button>
                </nav>
              </div>
              <div class="user-panel-main">
                <div id="panelContent">
                  <!-- Content will be loaded dynamically -->
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
  window.UserPanel = UserPanel
}
