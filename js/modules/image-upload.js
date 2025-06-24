// Sistema de Upload de Imágenes
import { Utils } from "./utils.js"

export const ImageUpload = {
  initialized: false,
  uploadedImages: new Map(),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  async init() {
    console.log("🖼️ Initializing Image Upload...")
    this.setupEventListeners()
    this.initialized = true
    console.log("✅ Image Upload initialized")
  },

  setupEventListeners() {
    // Setup drag and drop zones
    this.setupDragAndDrop()

    // Setup file input handlers
    this.setupFileInputs()
  },

  setupDragAndDrop() {
    document.addEventListener("dragover", (e) => {
      e.preventDefault()
      this.handleDragOver(e)
    })

    document.addEventListener("drop", (e) => {
      e.preventDefault()
      this.handleDrop(e)
    })

    document.addEventListener("dragleave", (e) => {
      this.handleDragLeave(e)
    })
  },

  setupFileInputs() {
    // Listen for file input changes
    document.addEventListener("change", (e) => {
      if (e.target.type === "file" && e.target.classList.contains("image-upload-input")) {
        this.handleFileSelect(e.target.files, e.target)
      }
    })
  },

  handleDragOver(e) {
    const dropZone = e.target.closest(".image-drop-zone")
    if (dropZone) {
      dropZone.classList.add("drag-over")
    }
  },

  handleDragLeave(e) {
    const dropZone = e.target.closest(".image-drop-zone")
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove("drag-over")
    }
  },

  handleDrop(e) {
    const dropZone = e.target.closest(".image-drop-zone")
    if (dropZone) {
      dropZone.classList.remove("drag-over")
      const files = e.dataTransfer.files
      this.handleFileSelect(files, dropZone)
    }
  },

  async handleFileSelect(files, target) {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter((file) => this.validateFile(file))

    if (validFiles.length === 0) {
      if (window.UI) {
        window.UI.showNotification("No se seleccionaron archivos válidos", "error")
      }
      return
    }

    try {
      const uploadPromises = validFiles.map((file) => this.uploadFile(file, target))
      const results = await Promise.all(uploadPromises)

      this.handleUploadResults(results, target)
    } catch (error) {
      Utils.handleError(error, "handleFileSelect")
    }
  },

  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      if (window.UI) {
        window.UI.showNotification(`Tipo de archivo no permitido: ${file.type}`, "error")
      }
      return false
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      if (window.UI) {
        window.UI.showNotification(
          `Archivo muy grande: ${Utils.formatFileSize(file.size)}. Máximo: ${Utils.formatFileSize(this.maxFileSize)}`,
          "error",
        )
      }
      return false
    }

    return true
  },

  async uploadFile(file, target) {
    try {
      // Show upload progress
      this.showUploadProgress(target, file.name)

      // Create file ID
      const fileId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Process image
      const processedImage = await this.processImage(file)

      // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
      const uploadResult = await this.simulateUpload(processedImage, fileId)

      // Store image data
      this.uploadedImages.set(fileId, {
        id: fileId,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        uploadedAt: new Date().toISOString(),
      })

      return {
        success: true,
        fileId,
        file: this.uploadedImages.get(fileId),
      }
    } catch (error) {
      console.error("Upload error:", error)
      return {
        success: false,
        error: error.message,
        fileName: file.name,
      }
    }
  },

  async processImage(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions (max 1920x1080)
          const maxWidth = 1920
          const maxHeight = 1080
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          // Set canvas dimensions
          canvas.width = width
          canvas.height = height

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(resolve, "image/jpeg", 0.85)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Error loading image"))
      img.src = URL.createObjectURL(file)
    })
  },

  async simulateUpload(blob, fileId) {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Create object URLs (in production, these would be real URLs)
    const url = URL.createObjectURL(blob)
    const thumbnailUrl = await this.createThumbnail(blob)

    return {
      url,
      thumbnailUrl,
      fileId,
    }
  },

  async createThumbnail(blob) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Create 200x200 thumbnail
        const size = 200
        canvas.width = size
        canvas.height = size

        // Calculate crop dimensions
        const scale = Math.max(size / img.width, size / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const x = (size - scaledWidth) / 2
        const y = (size - scaledHeight) / 2

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

        canvas.toBlob(
          (thumbnailBlob) => {
            resolve(URL.createObjectURL(thumbnailBlob))
          },
          "image/jpeg",
          0.8,
        )
      }

      img.src = URL.createObjectURL(blob)
    })
  },

  showUploadProgress(target, fileName) {
    const progressContainer = target.querySelector(".upload-progress") || this.createProgressContainer(target)

    progressContainer.innerHTML = `
      <div class="upload-item">
        <div class="upload-info">
          <span class="file-name">${fileName}</span>
          <span class="upload-status">Subiendo...</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    `

    // Animate progress bar
    const progressFill = progressContainer.querySelector(".progress-fill")
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
      }
      progressFill.style.width = `${progress}%`
    }, 200)
  },

  createProgressContainer(target) {
    const container = Utils.createElement("div", {
      className: "upload-progress",
    })
    target.appendChild(container)
    return container
  },

  handleUploadResults(results, target) {
    const successful = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)

    if (successful.length > 0) {
      this.displayUploadedImages(successful, target)

      if (window.UI) {
        window.UI.showNotification(`${successful.length} imagen(es) subida(s) correctamente`)
      }
    }

    if (failed.length > 0) {
      console.error("Failed uploads:", failed)
      if (window.UI) {
        window.UI.showNotification(`Error subiendo ${failed.length} archivo(s)`, "error")
      }
    }

    // Clear progress
    const progressContainer = target.querySelector(".upload-progress")
    if (progressContainer) {
      setTimeout(() => {
        progressContainer.remove()
      }, 2000)
    }
  },

  displayUploadedImages(results, target) {
    const gallery = target.querySelector(".image-gallery") || this.createImageGallery(target)

    results.forEach((result) => {
      const imageElement = this.createImageElement(result.file)
      gallery.appendChild(imageElement)
    })
  },

  createImageGallery(target) {
    const gallery = Utils.createElement("div", {
      className: "image-gallery",
    })
    target.appendChild(gallery)
    return gallery
  },

  createImageElement(imageData) {
    const imageElement = Utils.createElement("div", {
      className: "uploaded-image",
      innerHTML: `
        <div class="image-preview">
          <img src="${imageData.thumbnailUrl}" alt="${imageData.originalName}" loading="lazy">
          <div class="image-overlay">
            <button class="btn btn-sm btn-primary" onclick="ImageUpload.selectImage('${imageData.id}')">
              Seleccionar
            </button>
            <button class="btn btn-sm btn-danger" onclick="ImageUpload.deleteImage('${imageData.id}')">
              Eliminar
            </button>
          </div>
        </div>
        <div class="image-info">
          <span class="image-name">${imageData.originalName}</span>
          <span class="image-size">${Utils.formatFileSize(imageData.size)}</span>
        </div>
      `,
    })

    return imageElement
  },

  selectImage(imageId) {
    const imageData = this.uploadedImages.get(imageId)
    if (!imageData) return

    // Trigger custom event
    document.dispatchEvent(
      new CustomEvent("imageSelected", {
        detail: { imageData },
      }),
    )

    if (window.UI) {
      window.UI.showNotification("Imagen seleccionada")
    }
  },

  deleteImage(imageId) {
    if (confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      const imageData = this.uploadedImages.get(imageId)
      if (imageData) {
        // Revoke object URLs to free memory
        URL.revokeObjectURL(imageData.url)
        URL.revokeObjectURL(imageData.thumbnailUrl)

        // Remove from storage
        this.uploadedImages.delete(imageId)

        // Remove from DOM
        const imageElement = document.querySelector(`[onclick*="${imageId}"]`)?.closest(".uploaded-image")
        if (imageElement) {
          imageElement.remove()
        }

        if (window.UI) {
          window.UI.showNotification("Imagen eliminada")
        }
      }
    }
  },

  // Create upload zone HTML
  createUploadZone(containerId, options = {}) {
    const container = Utils.$(containerId)
    if (!container) return

    const uploadZoneHTML = `
      <div class="image-upload-zone">
        <div class="image-drop-zone">
          <div class="drop-zone-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
            <h4>Arrastra imágenes aquí</h4>
            <p>o haz clic para seleccionar archivos</p>
            <p class="upload-limits">
              Máximo ${Utils.formatFileSize(this.maxFileSize)} por archivo<br>
              Formatos: JPG, PNG, GIF, WebP
            </p>
          </div>
          <input type="file" class="image-upload-input" multiple accept="${this.allowedTypes.join(",")}" style="display: none;">
        </div>
        <div class="image-gallery"></div>
        <div class="upload-progress"></div>
      </div>
    `

    container.innerHTML = uploadZoneHTML

    // Setup click handler for file selection
    const dropZone = container.querySelector(".image-drop-zone")
    const fileInput = container.querySelector(".image-upload-input")

    dropZone.addEventListener("click", () => {
      fileInput.click()
    })

    return container
  },

  // Get all uploaded images
  getUploadedImages() {
    return Array.from(this.uploadedImages.values())
  },

  // Clear all uploaded images
  clearUploadedImages() {
    // Revoke all object URLs
    this.uploadedImages.forEach((imageData) => {
      URL.revokeObjectURL(imageData.url)
      URL.revokeObjectURL(imageData.thumbnailUrl)
    })

    this.uploadedImages.clear()

    // Clear galleries
    Utils.$$(".image-gallery").forEach((gallery) => {
      gallery.innerHTML = ""
    })
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.ImageUpload = ImageUpload
}
