// Generador de Invitaciones
import { Utils } from "./utils.js"

export const InvitationGenerator = {
  initialized: false,
  templates: new Map(),
  currentInvitation: null,

  async init() {
    console.log("📄 Initializing Invitation Generator...")
    await this.loadTemplates()
    this.setupEventListeners()
    this.initialized = true
    console.log("✅ Invitation Generator initialized")
  },

  async loadTemplates() {
    // Load invitation templates
    this.templates.set("boda-elegante", {
      id: "boda-elegante",
      name: "Boda Elegante",
      category: "bodas",
      html: this.getWeddingElegantTemplate(),
      css: this.getWeddingElegantStyles(),
      fonts: ["Playfair Display", "Source Sans Pro"],
    })

    this.templates.set("cumple-festivo", {
      id: "cumple-festivo",
      name: "Cumpleaños Festivo",
      category: "cumpleanos",
      html: this.getBirthdayFestiveTemplate(),
      css: this.getBirthdayFestiveStyles(),
      fonts: ["Fredoka One", "Open Sans"],
    })

    this.templates.set("bautizo-angelical", {
      id: "bautizo-angelical",
      name: "Bautizo Angelical",
      category: "bautizos",
      html: this.getBaptismAngelicTemplate(),
      css: this.getBaptismAngelicStyles(),
      fonts: ["Dancing Script", "Lato"],
    })

    this.templates.set("baby-dulce", {
      id: "baby-dulce",
      name: "Baby Shower Dulce",
      category: "baby-shower",
      html: this.getBabyShowerSweetTemplate(),
      css: this.getBabyShowerSweetStyles(),
      fonts: ["Quicksand", "Nunito"],
    })
  },

  setupEventListeners() {
    // Listen for invitation generation requests
    document.addEventListener("generateInvitation", (e) => {
      this.generateInvitation(e.detail)
    })

    // Listen for preview requests
    document.addEventListener("previewInvitation", (e) => {
      this.previewInvitation(e.detail)
    })
  },

  async generateInvitation(data) {
    try {
      const { templateId, customization, format = "web" } = data

      // Get template
      const template = this.templates.get(templateId)
      if (!template) {
        throw new Error(`Template not found: ${templateId}`)
      }

      // Generate invitation
      const invitation = await this.processTemplate(template, customization)

      // Store current invitation
      this.currentInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        customization,
        format,
        html: invitation.html,
        css: invitation.css,
        generatedAt: new Date().toISOString(),
      }

      // Save to storage
      this.saveInvitation(this.currentInvitation)

      // Generate based on format
      switch (format) {
        case "web":
          return this.generateWebInvitation(invitation)
        case "pdf":
          return this.generatePDFInvitation(invitation)
        case "image":
          return this.generateImageInvitation(invitation)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      Utils.handleError(error, "generateInvitation")
      throw error
    }
  },

  async processTemplate(template, customization) {
    // Load fonts
    await this.loadFonts(template.fonts)

    // Process HTML template
    let html = template.html
    let css = template.css

    // Replace placeholders
    const replacements = {
      "{{eventTitle}}": customization.title || "Tu Evento Especial",
      "{{names}}": customization.names || "Nombres",
      "{{date}}": customization.date ? Utils.formatDate(customization.date) : "Fecha",
      "{{time}}": customization.time || "Hora",
      "{{location}}": customization.location || "Ubicación",
      "{{message}}": customization.message || "",
      "{{rsvpLink}}": this.generateRSVPLink(customization),
      "{{backgroundImage}}": customization.backgroundImage || "",
      "{{primaryColor}}": customization.primaryColor || "#ec4899",
      "{{secondaryColor}}": customization.secondaryColor || "#a855f7",
    }

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder, "g"), value)
      css = css.replace(new RegExp(placeholder, "g"), value)
    })

    return { html, css }
  },

  async loadFonts(fonts) {
    const fontPromises = fonts.map((font) => this.loadFont(font))
    await Promise.all(fontPromises)
  },

  loadFont(fontFamily) {
    return new Promise((resolve, reject) => {
      if (document.fonts.check(`12px "${fontFamily}"`)) {
        resolve()
        return
      }

      const link = document.createElement("link")
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(" ", "+")}:wght@300;400;600;700&display=swap`
      link.rel = "stylesheet"

      link.onload = resolve
      link.onerror = reject

      document.head.appendChild(link)
    })
  },

  generateRSVPLink(customization) {
    const baseUrl = window.location.origin
    const eventId = customization.eventId || "default"
    return `${baseUrl}/rsvp/${eventId}`
  },

  async generateWebInvitation(invitation) {
    // Create complete HTML document
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.currentInvitation.customization.title || "Invitación"}</title>
        <style>${invitation.css}</style>
      </head>
      <body>
        ${invitation.html}
      </body>
      </html>
    `

    // Create blob URL
    const blob = new Blob([fullHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    return {
      type: "web",
      url,
      html: fullHTML,
      invitation: this.currentInvitation,
    }
  },

  async generatePDFInvitation(invitation) {
    try {
      // Create temporary iframe for PDF generation
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      iframe.style.width = "800px"
      iframe.style.height = "600px"
      document.body.appendChild(iframe)

      // Load content
      const doc = iframe.contentDocument
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            ${invitation.css}
          </style>
        </head>
        <body>${invitation.html}</body>
        </html>
      `)
      doc.close()

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate PDF (in production, use a proper PDF library)
      const canvas = await this.htmlToCanvas(iframe.contentDocument.body)
      const pdfBlob = await this.canvasToPDF(canvas)

      // Cleanup
      document.body.removeChild(iframe)

      const url = URL.createObjectURL(pdfBlob)

      return {
        type: "pdf",
        url,
        blob: pdfBlob,
        invitation: this.currentInvitation,
      }
    } catch (error) {
      console.error("PDF generation error:", error)
      throw new Error("Error generando PDF")
    }
  },

  async generateImageInvitation(invitation) {
    try {
      // Create temporary container
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = "800px"
      container.style.height = "600px"
      container.innerHTML = `
        <style>${invitation.css}</style>
        ${invitation.html}
      `
      document.body.appendChild(container)

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Convert to canvas
      const canvas = await this.htmlToCanvas(container)

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", 1.0)
      })

      // Cleanup
      document.body.removeChild(container)

      const url = URL.createObjectURL(blob)

      return {
        type: "image",
        url,
        blob,
        canvas,
        invitation: this.currentInvitation,
      }
    } catch (error) {
      console.error("Image generation error:", error)
      throw new Error("Error generando imagen")
    }
  },

  async htmlToCanvas(element) {
    // In production, use html2canvas library
    // For demo, create a simple canvas representation
    const canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 600

    const ctx = canvas.getContext("2d")

    // Simple representation
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, 800, 600)

    ctx.fillStyle = "#333333"
    ctx.font = "24px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Invitación Generada", 400, 300)

    return canvas
  },

  async canvasToPDF(canvas) {
    // In production, use jsPDF or similar
    // For demo, return canvas as blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png")
    })
  },

  previewInvitation(data) {
    const previewModal = this.createPreviewModal(data)
    document.body.appendChild(previewModal)

    // Open modal
    setTimeout(() => {
      previewModal.classList.add("active")
    }, 100)
  },

  createPreviewModal(data) {
    const modal = Utils.createElement("div", {
      className: "modal preview-modal",
      innerHTML: `
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Vista Previa de Invitación</h2>
            <button class="close-modal" onclick="this.closest('.modal').remove()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" x2="6" y1="6" y2="18"/>
                <line x1="6" x2="18" y1="6" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="preview-container">
              <div class="preview-frame">
                <iframe id="previewFrame" style="width: 100%; height: 600px; border: none;"></iframe>
              </div>
              <div class="preview-actions">
                <button class="btn btn-outline" onclick="InvitationGenerator.downloadInvitation('web')">
                  Descargar Web
                </button>
                <button class="btn btn-outline" onclick="InvitationGenerator.downloadInvitation('pdf')">
                  Descargar PDF
                </button>
                <button class="btn btn-outline" onclick="InvitationGenerator.downloadInvitation('image')">
                  Descargar Imagen
                </button>
                <button class="btn btn-primary" onclick="InvitationGenerator.publishInvitation()">
                  Publicar Invitación
                </button>
              </div>
            </div>
          </div>
        </div>
      `,
    })

    // Load preview content
    setTimeout(async () => {
      const iframe = modal.querySelector("#previewFrame")
      const result = await this.generateInvitation({
        templateId: data.templateId,
        customization: data.customization,
        format: "web",
      })
      iframe.src = result.url
    }, 100)

    return modal
  },

  async downloadInvitation(format) {
    if (!this.currentInvitation) {
      if (window.UI) {
        window.UI.showNotification("No hay invitación para descargar", "error")
      }
      return
    }

    try {
      const result = await this.generateInvitation({
        templateId: this.currentInvitation.templateId,
        customization: this.currentInvitation.customization,
        format,
      })

      // Create download link
      const a = document.createElement("a")
      a.href = result.url
      a.download = `invitacion_${this.currentInvitation.customization.title || "evento"}.${format === "web" ? "html" : format === "pdf" ? "pdf" : "png"}`
      a.click()

      if (window.UI) {
        window.UI.showNotification(`Invitación descargada en formato ${format.toUpperCase()}`)
      }
    } catch (error) {
      Utils.handleError(error, "downloadInvitation")
    }
  },

  async publishInvitation() {
    if (!this.currentInvitation) {
      if (window.UI) {
        window.UI.showNotification("No hay invitación para publicar", "error")
      }
      return
    }

    try {
      // Generate subdomain
      const subdomain = this.generateSubdomain(this.currentInvitation.customization)

      // In production, this would deploy to your hosting service
      const publishResult = await this.deployInvitation(this.currentInvitation, subdomain)

      if (window.UI) {
        window.UI.showNotification(`¡Invitación publicada! URL: ${publishResult.url}`)
      }

      // Copy URL to clipboard
      navigator.clipboard.writeText(publishResult.url)
    } catch (error) {
      Utils.handleError(error, "publishInvitation")
    }
  },

  generateSubdomain(customization) {
    const base = customization.names?.toLowerCase().replace(/\s+/g, "-") || "evento"
    const date = customization.date ? new Date(customization.date).getFullYear() : new Date().getFullYear()
    return `${base}-${date}-${Math.random().toString(36).substr(2, 6)}`
  },

  async deployInvitation(invitation, subdomain) {
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const url = `https://${subdomain}.inviteu.digital`

    // Store published invitation
    const publishedInvitations = Utils.getStorage("published_invitations") || []
    publishedInvitations.push({
      ...invitation,
      subdomain,
      url,
      publishedAt: new Date().toISOString(),
    })
    Utils.setStorage("published_invitations", publishedInvitations)

    return { url, subdomain }
  },

  saveInvitation(invitation) {
    const savedInvitations = Utils.getStorage("saved_invitations") || []
    const existingIndex = savedInvitations.findIndex((inv) => inv.id === invitation.id)

    if (existingIndex !== -1) {
      savedInvitations[existingIndex] = invitation
    } else {
      savedInvitations.push(invitation)
    }

    Utils.setStorage("saved_invitations", savedInvitations)
  },

  getSavedInvitations() {
    return Utils.getStorage("saved_invitations") || []
  },

  getPublishedInvitations() {
    return Utils.getStorage("published_invitations") || []
  },

  // Template HTML and CSS methods
  getWeddingElegantTemplate() {
    return `
      <div class="invitation-container wedding-elegant">
        <div class="invitation-header">
          <div class="ornament top"></div>
          <h1 class="event-title">{{eventTitle}}</h1>
          <div class="ornament bottom"></div>
        </div>
        
        <div class="invitation-body">
          <div class="names-section">
            <h2 class="names">{{names}}</h2>
          </div>
          
          <div class="details-section">
            <div class="detail-item">
              <div class="detail-icon">📅</div>
              <div class="detail-text">{{date}}</div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">🕐</div>
              <div class="detail-text">{{time}}</div>
            </div>
            <div class="detail-item">
              <div class="detail-icon">📍</div>
              <div class="detail-text">{{location}}</div>
            </div>
          </div>
          
          <div class="message-section">
            <p class="message">{{message}}</p>
          </div>
          
          <div class="rsvp-section">
            <a href="{{rsvpLink}}" class="rsvp-button">Confirmar Asistencia</a>
          </div>
        </div>
      </div>
    `
  },

  getWeddingElegantStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@300;400;600&display=swap');
      
      .invitation-container.wedding-elegant {
        max-width: 600px;
        margin: 0 auto;
        background: linear-gradient(135deg, #fdf2f8, #faf5ff);
        border-radius: 20px;
        padding: 40px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        font-family: 'Source Sans Pro', sans-serif;
        color: #333;
        position: relative;
        overflow: hidden;
      }
      
      .invitation-container.wedding-elegant::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: url('{{backgroundImage}}') center/cover;
        opacity: 0.1;
        z-index: 0;
      }
      
      .invitation-header {
        text-align: center;
        margin-bottom: 40px;
        position: relative;
        z-index: 1;
      }
      
      .ornament {
        width: 100px;
        height: 20px;
        background: linear-gradient(to right, {{primaryColor}}, {{secondaryColor}});
        margin: 20px auto;
        border-radius: 10px;
      }
      
      .event-title {
        font-family: 'Playfair Display', serif;
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(to right, {{primaryColor}}, {{secondaryColor}});
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
      }
      
      .names {
        font-family: 'Playfair Display', serif;
        font-size: 3rem;
        font-weight: 400;
        color: #333;
        margin: 20px 0;
        text-align: center;
      }
      
      .details-section {
        margin: 40px 0;
        position: relative;
        z-index: 1;
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px 0;
        font-size: 1.2rem;
      }
      
      .detail-icon {
        font-size: 1.5rem;
        margin-right: 15px;
      }
      
      .detail-text {
        font-weight: 600;
        color: #555;
      }
      
      .message-section {
        text-align: center;
        margin: 40px 0;
        position: relative;
        z-index: 1;
      }
      
      .message {
        font-style: italic;
        font-size: 1.1rem;
        color: #666;
        line-height: 1.6;
      }
      
      .rsvp-section {
        text-align: center;
        margin-top: 40px;
        position: relative;
        z-index: 1;
      }
      
      .rsvp-button {
        display: inline-block;
        background: linear-gradient(to right, {{primaryColor}}, {{secondaryColor}});
        color: white;
        padding: 15px 30px;
        border-radius: 30px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.1rem;
        transition: transform 0.3s ease;
      }
      
      .rsvp-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
      }
    `
  },

  getBirthdayFestiveTemplate() {
    return `
      <div class="invitation-container birthday-festive">
        <div class="confetti-bg"></div>
        <div class="invitation-content">
          <div class="party-header">
            <h1 class="party-title">🎉 {{eventTitle}} 🎉</h1>
            <div class="celebration-text">¡Es hora de celebrar!</div>
          </div>
          
          <div class="birthday-person">
            <h2 class="birthday-name">{{names}}</h2>
            <div class="age-badge">¡Cumple años!</div>
          </div>
          
          <div class="party-details">
            <div class="detail-card">
              <div class="detail-icon">🗓️</div>
              <div class="detail-label">Fecha</div>
              <div class="detail-value">{{date}}</div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">⏰</div>
              <div class="detail-label">Hora</div>
              <div class="detail-value">{{time}}</div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">📍</div>
              <div class="detail-label">Lugar</div>
              <div class="detail-value">{{location}}</div>
            </div>
          </div>
          
          <div class="party-message">
            <p>{{message}}</p>
          </div>
          
          <div class="party-rsvp">
            <a href="{{rsvpLink}}" class="party-button">¡Confirma tu asistencia!</a>
          </div>
        </div>
      </div>
    `
  },

  getBirthdayFestiveStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&family=Open+Sans:wght@300;400;600;700&display=swap');
      
      .invitation-container.birthday-festive {
        max-width: 600px;
        margin: 0 auto;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
        background-size: 400% 400%;
        animation: gradientShift 3s ease infinite;
        border-radius: 25px;
        padding: 40px;
        font-family: 'Open Sans', sans-serif;
        color: #333;
        position: relative;
        overflow: hidden;
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .confetti-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          radial-gradient(circle at 20% 20%, #ff6b6b 2px, transparent 2px),
          radial-gradient(circle at 80% 80%, #4ecdc4 2px, transparent 2px),
          radial-gradient(circle at 40% 60%, #feca57 2px, transparent 2px),
          radial-gradient(circle at 60% 40%, #96ceb4 2px, transparent 2px);
        background-size: 50px 50px, 60px 60px, 40px 40px, 70px 70px;
        opacity: 0.3;
        animation: confettiFloat 6s ease-in-out infinite;
      }
      
      @keyframes confettiFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      .invitation-content {
        position: relative;
        z-index: 1;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 30px;
        backdrop-filter: blur(10px);
      }
      
      .party-header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .party-title {
        font-family: 'Fredoka One', cursive;
        font-size: 2.5rem;
        color: {{primaryColor}};
        margin: 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      
      .celebration-text {
        font-size: 1.2rem;
        color: {{secondaryColor}};
        font-weight: 600;
        margin-top: 10px;
      }
      
      .birthday-person {
        text-align: center;
        margin: 30px 0;
      }
      
      .birthday-name {
        font-family: 'Fredoka One', cursive;
        font-size: 3rem;
        color: #333;
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .age-badge {
        display: inline-block;
        background: linear-gradient(45deg, {{primaryColor}}, {{secondaryColor}});
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: 600;
        margin-top: 10px;
        font-size: 1.1rem;
      }
      
      .party-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin: 30px 0;
      }
      
      .detail-card {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
      }
      
      .detail-card:hover {
        border-color: {{primaryColor}};
        transform: translateY(-5px);
      }
      
      .detail-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      .detail-label {
        font-size: 0.9rem;
        color: #666;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .detail-value {
        font-size: 1.1rem;
        color: #333;
        font-weight: 700;
        margin-top: 5px;
      }
      
      .party-message {
        text-align: center;
        margin: 30px 0;
        padding: 20px;
        background: rgba({{primaryColor}}, 0.1);
        border-radius: 15px;
        border-left: 4px solid {{primaryColor}};
      }
      
      .party-message p {
        font-size: 1.1rem;
        color: #555;
        line-height: 1.6;
        margin: 0;
      }
      
      .party-rsvp {
        text-align: center;
        margin-top: 30px;
      }
      
      .party-button {
        display: inline-block;
        background: linear-gradient(45deg, {{primaryColor}}, {{secondaryColor}});
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.2rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      }
      
      .party-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      }
    `
  },

  getBaptismAngelicTemplate() {
    return `
      <div class="invitation-container baptism-angelic">
        <div class="heavenly-bg"></div>
        <div class="invitation-content">
          <div class="sacred-header">
            <div class="cross-ornament">✝</div>
            <h1 class="sacred-title">{{eventTitle}}</h1>
            <div class="dove-ornament">🕊️</div>
          </div>
          
          <div class="blessed-child">
            <h2 class="child-name">{{names}}</h2>
            <div class="blessing-text">Será bendecido(a) en el nombre del Señor</div>
          </div>
          
          <div class="ceremony-details">
            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <span class="detail-text">{{date}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">⛪</span>
              <span class="detail-text">{{time}}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <span class="detail-text">{{location}}</span>
            </div>
          </div>
          
          <div class="sacred-message">
            <div class="quote-mark">"</div>
            <p class="message-text">{{message}}</p>
            <div class="quote-mark">"</div>
          </div>
          
          <div class="ceremony-rsvp">
            <a href="{{rsvpLink}}" class="sacred-button">Confirmar Asistencia</a>
          </div>
          
          <div class="blessing-footer">
            <p>Que la paz del Señor esté con ustedes</p>
          </div>
        </div>
      </div>
    `
  },

  getBaptismAngelicStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Lato:wght@300;400;600&display=swap');
      
      .invitation-container.baptism-angelic {
        max-width: 600px;
        margin: 0 auto;
        background: linear-gradient(135deg, #f8f9ff, #e8f4fd, #fff8e1);
        border-radius: 20px;
        padding: 40px;
        font-family: 'Lato', sans-serif;
        color: #4a5568;
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      }
      
      .heavenly-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8) 1px, transparent 1px),
          radial-gradient(circle at 70% 80%, rgba(255,255,255,0.6) 1px, transparent 1px),
          radial-gradient(circle at 20% 70%, rgba(255,255,255,0.4) 1px, transparent 1px);
        background-size: 100px 100px, 150px 150px, 80px 80px;
        animation: heavenlyFloat 8s ease-in-out infinite;
      }
      
      @keyframes heavenlyFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-5px) rotate(1deg); }
      }
      
      .invitation-content {
        position: relative;
        z-index: 1;
      }
      
      .sacred-header {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .cross-ornament {
        font-size: 2rem;
        color: {{primaryColor}};
        margin-bottom: 15px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .sacred-title {
        font-family: 'Dancing Script', cursive;
        font-size: 2.8rem;
        font-weight: 600;
        color: {{primaryColor}};
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .dove-ornament {
        font-size: 1.5rem;
        margin-top: 15px;
        opacity: 0.8;
      }
      
      .blessed-child {
        text-align: center;
        margin: 40px 0;
        padding: 30px;
        background: rgba(255,255,255,0.7);
        border-radius: 15px;
        border: 1px solid rgba({{primaryColor}}, 0.2);
      }
      
      .child-name {
        font-family: 'Dancing Script', cursive;
        font-size: 3.5rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .blessing-text {
        font-size: 1.1rem;
        color: {{secondaryColor}};
        font-style: italic;
        margin-top: 15px;
        font-weight: 300;
      }
      
      .ceremony-details {
        margin: 40px 0;
        background: rgba(255,255,255,0.8);
        border-radius: 15px;
        padding: 30px;
      }
      
      .detail-row {
        display: flex;
        align-items: center;
        margin: 20px 0;
        font-size: 1.2rem;
      }
      
      .detail-icon {
        font-size: 1.5rem;
        margin-right: 20px;
        width: 30px;
        text-align: center;
      }
      
      .detail-text {
        font-weight: 400;
        color: #4a5568;
      }
      
      .sacred-message {
        text-align: center;
        margin: 40px 0;
        position: relative;
        padding: 30px;
        background: linear-gradient(135deg, rgba({{primaryColor}}, 0.05), rgba({{secondaryColor}}, 0.05));
        border-radius: 15px;
      }
      
      .quote-mark {
        font-family: 'Dancing Script', cursive;
        font-size: 4rem;
        color: {{primaryColor}};
        opacity: 0.3;
        line-height: 1;
      }
      
      .quote-mark:first-child {
        position: absolute;
        top: 10px;
        left: 20px;
      }
      
      .quote-mark:last-child {
        position: absolute;
        bottom: 10px;
        right: 20px;
        transform: rotate(180deg);
      }
      
      .message-text {
        font-size: 1.1rem;
        color: #4a5568;
        line-height: 1.8;
        margin: 20px 0;
        font-style: italic;
        position: relative;
        z-index: 1;
      }
      
      .ceremony-rsvp {
        text-align: center;
        margin: 40px 0;
      }
      
      .sacred-button {
        display: inline-block;
        background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
        color: white;
        padding: 15px 35px;
        border-radius: 30px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      }
      
      .sacred-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      }
      
      .blessing-footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px solid rgba({{primaryColor}}, 0.2);
      }
      
      .blessing-footer p {
        font-style: italic;
        color: {{secondaryColor}};
        font-size: 1rem;
        margin: 0;
      }
    `
  },

  getBabyShowerSweetTemplate() {
    return `
      <div class="invitation-container baby-sweet">
        <div class="baby-bg"></div>
        <div class="invitation-content">
          <div class="sweet-header">
            <div class="baby-icons">👶 🍼 👶</div>
            <h1 class="sweet-title">{{eventTitle}}</h1>
            <div class="hearts">💕 💕 💕</div>
          </div>
          
          <div class="expecting-parents">
            <div class="stork-icon">🦢</div>
            <h2 class="parents-names">{{names}}</h2>
            <div class="expecting-text">¡Esperan la llegada de su bebé!</div>
          </div>
          
          <div class="shower-details">
            <div class="detail-bubble">
              <div class="bubble-icon">📅</div>
              <div class="bubble-content">
                <div class="bubble-label">Fecha</div>
                <div class="bubble-value">{{date}}</div>
              </div>
            </div>
            <div class="detail-bubble">
              <div class="bubble-icon">🕐</div>
              <div class="bubble-content">
                <div class="bubble-label">Hora</div>
                <div class="bubble-value">{{time}}</div>
              </div>
            </div>
            <div class="detail-bubble">
              <div class="bubble-icon">🏠</div>
              <div class="bubble-content">
                <div class="bubble-label">Lugar</div>
                <div class="bubble-value">{{location}}</div>
              </div>
            </div>
          </div>
          
          <div class="sweet-message">
            <div class="cloud-message">
              <p>{{message}}</p>
            </div>
          </div>
          
          <div class="shower-rsvp">
            <a href="{{rsvpLink}}" class="sweet-button">¡Confirma tu asistencia!</a>
          </div>
          
          <div class="baby-footer">
            <div class="footer-icons">🎁 👶 🎈 🧸 🎁</div>
            <p>¡Celebremos juntos este momento especial!</p>
          </div>
        </div>
      </div>
    `
  },

  getBabyShowerSweetStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;600;700&family=Nunito:wght@300;400;600;700&display=swap');
      
      .invitation-container.baby-sweet {
        max-width: 600px;
        margin: 0 auto;
        background: linear-gradient(135deg, #fef7f0, #fdf2f8, #f0f9ff);
        border-radius: 25px;
        padding: 40px;
        font-family: 'Nunito', sans-serif;
        color: #374151;
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      }
      
      .baby-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 20% 30%, rgba({{primaryColor}}, 0.1) 20px, transparent 20px),
          radial-gradient(circle at 80% 70%, rgba({{secondaryColor}}, 0.1) 15px, transparent 15px),
          radial-gradient(circle at 40% 80%, rgba({{primaryColor}}, 0.08) 25px, transparent 25px),
          radial-gradient(circle at 60% 20%, rgba({{secondaryColor}}, 0.08) 18px, transparent 18px);
        background-size: 200px 200px, 150px 150px, 180px 180px, 220px 220px;
        animation: babyFloat 10s ease-in-out infinite;
      }
      
      @keyframes babyFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(0.5deg); }
        50% { transform: translateY(-6px) rotate(0deg); }
        75% { transform: translateY(-3px) rotate(-0.5deg); }
      }
      
      .invitation-content {
        position: relative;
        z-index: 1;
      }
      
      .sweet-header {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .baby-icons {
        font-size: 2rem;
        margin-bottom: 20px;
        letter-spacing: 10px;
      }
      
      .sweet-title {
        font-family: 'Quicksand', sans-serif;
        font-size: 2.5rem;
        font-weight: 600;
        color: {{primaryColor}};
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .hearts {
        font-size: 1.5rem;
        margin-top: 15px;
        letter-spacing: 5px;
      }
      
      .expecting-parents {
        text-align: center;
        margin: 40px 0;
        padding: 30px;
        background: rgba(255,255,255,0.8);
        border-radius: 20px;
        border: 2px dashed {{primaryColor}};
      }
      
      .stork-icon {
        font-size: 3rem;
        margin-bottom: 15px;
      }
      
      .parents-names {
        font-family: 'Quicksand', sans-serif;
        font-size: 2.8rem;
        font-weight: 700;
        color: #374151;
        margin: 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .expecting-text {
        font-size: 1.2rem;
        color: {{secondaryColor}};
        font-weight: 600;
        margin-top: 15px;
        font-style: italic;
      }
      
      .shower-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
        margin: 40px 0;
      }
      
      .detail-bubble {
        background: rgba(255,255,255,0.9);
        border-radius: 20px;
        padding: 25px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .detail-bubble::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba({{primaryColor}}, 0.1), transparent);
        transform: rotate(45deg);
        transition: all 0.3s ease;
        opacity: 0;
      }
      
      .detail-bubble:hover::before {
        opacity: 1;
        animation: shimmer 1s ease-in-out;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
      }
      
      .detail-bubble:hover {
        border-color: {{primaryColor}};
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      }
      
      .bubble-icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
        position: relative;
        z-index: 1;
      }
      
      .bubble-content {
        position: relative;
        z-index: 1;
      }
      
      .bubble-label {
        font-size: 0.9rem;
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 5px;
      }
      
      .bubble-value {
        font-size: 1.1rem;
        color: #374151;
        font-weight: 700;
      }
      
      .sweet-message {
        margin: 40px 0;
        display: flex;
        justify-content: center;
      }
      
      .cloud-message {
        background: rgba(255,255,255,0.9);
        border-radius: 25px;
        padding: 25px 35px;
        position: relative;
        max-width: 80%;
        border: 2px solid rgba({{primaryColor}}, 0.2);
      }
      
      .cloud-message::before {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 30px;
        width: 0;
        height: 0;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-top: 15px solid rgba(255,255,255,0.9);
      }
      
      .cloud-message p {
        font-size: 1.1rem;
        color: #4b5563;
        line-height: 1.6;
        margin: 0;
        text-align: center;
        font-style: italic;
      }
      
      .shower-rsvp {
        text-align: center;
        margin: 40px 0;
      }
      
      .sweet-button {
        display: inline-block;
        background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
        color: white;
        padding: 18px 35px;
        border-radius: 25px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
      }
      
      .sweet-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s ease;
      }
      
      .sweet-button:hover::before {
        left: 100%;
      }
      
      .sweet-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      }
      
      .baby-footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 30px;
        border-top: 2px dashed rgba({{primaryColor}}, 0.3);
      }
      
      .footer-icons {
        font-size: 1.5rem;
        margin-bottom: 15px;
        letter-spacing: 8px;
      }
      
      .baby-footer p {
        font-size: 1rem;
        color: {{secondaryColor}};
        font-weight: 600;
        margin: 0;
        font-style: italic;
      }
    `
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.InvitationGenerator = InvitationGenerator
}
