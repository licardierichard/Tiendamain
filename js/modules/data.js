export const Data = {
  // Cache for performance
  _cache: new Map(),
  _cacheExpiry: new Map(),

  // Events data with enhanced metadata
  events: [
    {
      id: "boda-elegante",
      name: "Boda Elegante",
      category: "bodas",
      price: 299,
      description: "Diseño romántico con toques rosados",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["elegante", "rosado", "romántico"],
      features: ["Animaciones suaves", "Música de fondo", "Galería de fotos"],
      popularity: 95,
      createdAt: "2024-01-15",
    },
    {
      id: "boda-rustica",
      name: "Boda Rústica",
      category: "bodas",
      price: 299,
      description: "Estilo campestre y natural",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["rústico", "natural", "campestre"],
      features: ["Elementos naturales", "Tipografía artesanal", "Colores tierra"],
      popularity: 88,
      createdAt: "2024-01-20",
    },
    {
      id: "cumple-festivo",
      name: "Cumpleaños Festivo",
      category: "cumpleanos",
      price: 199,
      description: "Colorido y lleno de diversión",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["colorido", "festivo", "divertido"],
      features: ["Confeti animado", "Colores vibrantes", "Efectos de celebración"],
      popularity: 92,
      createdAt: "2024-02-01",
    },
    {
      id: "cumple-elegante",
      name: "Cumpleaños Elegante",
      category: "cumpleanos",
      price: 199,
      description: "Sofisticado para adultos",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["elegante", "sofisticado", "adultos"],
      features: ["Diseño minimalista", "Tipografía elegante", "Colores neutros"],
      popularity: 76,
      createdAt: "2024-02-05",
    },
    {
      id: "bautizo-angelical",
      name: "Bautizo Angelical",
      category: "bautizos",
      price: 179,
      description: "Tierno y celestial",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["angelical", "tierno", "celestial"],
      features: ["Elementos religiosos", "Colores pastel", "Símbolos sagrados"],
      popularity: 84,
      createdAt: "2024-02-10",
    },
    {
      id: "bautizo-moderno",
      name: "Bautizo Moderno",
      category: "bautizos",
      price: 179,
      description: "Contemporáneo y minimalista",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["moderno", "minimalista", "contemporáneo"],
      features: ["Diseño limpio", "Tipografía moderna", "Elementos geométricos"],
      popularity: 71,
      createdAt: "2024-02-15",
    },
    {
      id: "baby-dulce",
      name: "Baby Shower Dulce",
      category: "baby-shower",
      price: 159,
      description: "Colores pastel y ternura",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["dulce", "pastel", "tierno"],
      features: ["Colores suaves", "Ilustraciones tiernas", "Elementos de bebé"],
      popularity: 89,
      createdAt: "2024-02-20",
    },
    {
      id: "baby-safari",
      name: "Baby Shower Safari",
      category: "baby-shower",
      price: 159,
      description: "Aventura y diversión",
      image: "/placeholder.svg?height=300&width=400",
      tags: ["safari", "aventura", "animales"],
      features: ["Animales del safari", "Colores naturales", "Elementos de aventura"],
      popularity: 82,
      createdAt: "2024-02-25",
    },
  ],

  // Enhanced packages data
  packages: [
    {
      id: "basico",
      name: "Básico",
      price: { min: 159, max: 299 },
      features: [
        { name: "Desarrollo web personalizado", included: true, description: "Sitio web único para tu evento" },
        { name: "Subdominio exclusivo", included: true, description: "tuevento.inviteu.digital" },
        { name: "Acceso por 3 meses", included: true, description: "Disponible hasta después del evento" },
        { name: "Música de fondo incluida", included: true, description: "Biblioteca de música libre" },
        { name: "Diseño responsive", included: true, description: "Perfecto en todos los dispositivos" },
        { name: "RSVP básico integrado", included: true, description: "Confirmación de asistencia simple" },
      ],
      featured: false,
      popular: false,
      savings: 0,
      estimatedDelivery: "3-5 días",
    },
    {
      id: "intermedio",
      name: "Intermedio",
      price: { min: 299, max: 499 },
      features: [
        { name: "Todo lo del paquete Básico", included: true, description: "Todas las características anteriores" },
        { name: "Sistema RSVP avanzado", included: true, description: "Gestión completa de invitados" },
        { name: "Galería de fotos", included: true, description: "Comparte recuerdos del evento" },
        { name: "Cronograma del evento", included: true, description: "Programa detallado del día" },
        { name: "Personalización avanzada", included: true, description: "Más opciones de diseño" },
        { name: "Mapa de ubicación", included: true, description: "Integración con Google Maps" },
      ],
      featured: true,
      popular: true,
      savings: 15,
      estimatedDelivery: "2-4 días",
    },
    {
      id: "premium",
      name: "Premium",
      price: { min: 499, max: 799 },
      features: [
        { name: "Todo lo del paquete Intermedio", included: true, description: "Todas las características anteriores" },
        { name: "Animaciones personalizadas", included: true, description: "Efectos únicos y elegantes" },
        { name: "Video de fondo", included: true, description: "Contenido multimedia inmersivo" },
        { name: "Lista de regalos integrada", included: true, description: "Gestión completa de regalos" },
        { name: "Chat en vivo para invitados", included: true, description: "Comunicación en tiempo real" },
        { name: "Soporte prioritario 24/7", included: true, description: "Asistencia inmediata" },
      ],
      featured: false,
      popular: false,
      savings: 25,
      estimatedDelivery: "1-3 días",
    },
  ],

  // Enhanced testimonials data
  testimonials: [
    {
      id: 1,
      name: "María y Carlos",
      event: "Boda en Sevilla, 2024",
      rating: 5,
      text: "Nuestra invitación de boda fue absolutamente perfecta. El diseño capturó exactamente lo que queríamos y nuestros invitados quedaron encantados. ¡Altamente recomendado!",
      photo: "/placeholder.svg?height=60&width=60",
      verified: true,
      eventType: "bodas",
      package: "premium",
      date: "2024-03-15",
    },
    {
      id: 2,
      name: "Carmen López",
      event: "Cumpleaños en Valencia, 2024",
      rating: 5,
      text: "Para el cumpleaños de mi hija elegimos el diseño festivo y fue un éxito total. Los invitados se divirtieron mucho con la invitación interactiva.",
      photo: "/placeholder.svg?height=60&width=60",
      verified: true,
      eventType: "cumpleanos",
      package: "intermedio",
      date: "2024-04-02",
    },
    {
      id: 3,
      name: "Rosa Martín",
      event: "Baby Shower en Madrid, 2024",
      rating: 5,
      text: "El baby shower de mi nieta fue perfecto gracias a la invitación digital. El diseño dulce y la facilidad para confirmar asistencia hicieron todo más sencillo.",
      photo: "/placeholder.svg?height=60&width=60",
      verified: true,
      eventType: "baby-shower",
      package: "basico",
      date: "2024-04-20",
    },
  ],

  // Cache management
  setCacheItem(key, data, ttl = 300000) {
    // 5 minutes default
    this._cache.set(key, data)
    this._cacheExpiry.set(key, Date.now() + ttl)
  },

  getCacheItem(key) {
    if (this._cache.has(key)) {
      const expiry = this._cacheExpiry.get(key)
      if (Date.now() < expiry) {
        return this._cache.get(key)
      } else {
        this._cache.delete(key)
        this._cacheExpiry.delete(key)
      }
    }
    return null
  },

  clearCache() {
    this._cache.clear()
    this._cacheExpiry.clear()
  },

  // Enhanced getter methods with caching and filtering
  getEventById(id) {
    const cacheKey = `event_${id}`
    let event = this.getCacheItem(cacheKey)

    if (!event) {
      event = this.events.find((event) => event.id === id)
      if (event) {
        this.setCacheItem(cacheKey, event)
      }
    }

    return event
  },

  getEventsByCategory(category, options = {}) {
    const cacheKey = `events_${category}_${JSON.stringify(options)}`
    let events = this.getCacheItem(cacheKey)

    if (!events) {
      events = category === "todos" ? [...this.events] : this.events.filter((event) => event.category === category)

      // Apply sorting
      if (options.sortBy) {
        events = this.sortEvents(events, options.sortBy, options.sortOrder)
      }

      // Apply filtering
      if (options.filters) {
        events = this.filterEvents(events, options.filters)
      }

      // Apply pagination
      if (options.page && options.limit) {
        const start = (options.page - 1) * options.limit
        events = events.slice(start, start + options.limit)
      }

      this.setCacheItem(cacheKey, events)
    }

    return events
  },

  sortEvents(events, sortBy, order = "asc") {
    return [...events].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (order === "desc") {
        return bVal > aVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
  },

  filterEvents(events, filters) {
    return events.filter((event) => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === "priceRange") {
          return event.price >= value.min && event.price <= value.max
        }
        if (key === "tags") {
          return value.some((tag) => event.tags.includes(tag))
        }
        if (key === "search") {
          const searchTerm = value.toLowerCase()
          return (
            event.name.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
          )
        }
        return event[key] === value
      })
    })
  },

  getPackageById(id) {
    const cacheKey = `package_${id}`
    let pkg = this.getCacheItem(cacheKey)

    if (!pkg) {
      pkg = this.packages.find((p) => p.id === id)
      if (pkg) {
        this.setCacheItem(cacheKey, pkg)
      }
    }

    return pkg
  },

  getTestimonialsByCategory(category) {
    const cacheKey = `testimonials_${category}`
    let testimonials = this.getCacheItem(cacheKey)

    if (!testimonials) {
      testimonials =
        category === "todos" ? this.testimonials : this.testimonials.filter((t) => t.eventType === category)
      this.setCacheItem(cacheKey, testimonials)
    }

    return testimonials
  },

  // Statistics and analytics
  getEventStats() {
    const cacheKey = "event_stats"
    let stats = this.getCacheItem(cacheKey)

    if (!stats) {
      stats = {
        totalEvents: this.events.length,
        categoryCounts: this.events.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1
          return acc
        }, {}),
        averagePrice: this.events.reduce((sum, event) => sum + event.price, 0) / this.events.length,
        priceRange: {
          min: Math.min(...this.events.map((e) => e.price)),
          max: Math.max(...this.events.map((e) => e.price)),
        },
        popularityAverage: this.events.reduce((sum, event) => sum + event.popularity, 0) / this.events.length,
        mostPopular: this.events.reduce((prev, current) => (prev.popularity > current.popularity ? prev : current)),
      }

      this.setCacheItem(cacheKey, stats, 600000) // Cache for 10 minutes
    }

    return stats
  },

  getPackageStats() {
    const cacheKey = "package_stats"
    let stats = this.getCacheItem(cacheKey)

    if (!stats) {
      stats = {
        totalPackages: this.packages.length,
        priceRanges: this.packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          minPrice: pkg.price.min,
          maxPrice: pkg.price.max,
          avgPrice: (pkg.price.min + pkg.price.max) / 2,
        })),
        featuredPackage: this.packages.find((pkg) => pkg.featured),
        popularPackage: this.packages.find((pkg) => pkg.popular),
      }

      this.setCacheItem(cacheKey, stats, 600000)
    }

    return stats
  },

  // Status text mapping
  getStatusText(status) {
    const statusMap = {
      pending: "Pendiente",
      processing: "En Proceso",
      completed: "Completado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
      failed: "Fallido",
    }
    return statusMap[status] || "Desconocido"
  },

  getStatusColor(status) {
    const colorMap = {
      pending: "#f59e0b",
      processing: "#3b82f6",
      completed: "#10b981",
      cancelled: "#ef4444",
      refunded: "#6b7280",
      failed: "#ef4444",
    }
    return colorMap[status] || "#6b7280"
  },

  // Search functionality
  searchEvents(query, options = {}) {
    const cacheKey = `search_${query}_${JSON.stringify(options)}`
    let results = this.getCacheItem(cacheKey)

    if (!results) {
      const searchTerm = query.toLowerCase().trim()

      if (!searchTerm) {
        results = this.events
      } else {
        results = this.events.filter((event) => {
          const searchableText = [event.name, event.description, event.category, ...event.tags].join(" ").toLowerCase()

          return searchableText.includes(searchTerm)
        })
      }

      // Apply additional filters
      if (options.category && options.category !== "todos") {
        results = results.filter((event) => event.category === options.category)
      }

      if (options.priceRange) {
        results = results.filter(
          (event) => event.price >= options.priceRange.min && event.price <= options.priceRange.max,
        )
      }

      // Sort by relevance (simple scoring)
      if (searchTerm) {
        results = results
          .map((event) => ({
            ...event,
            relevanceScore: this.calculateRelevanceScore(event, searchTerm),
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      }

      this.setCacheItem(cacheKey, results, 60000) // Cache for 1 minute
    }

    return results
  },

  calculateRelevanceScore(event, searchTerm) {
    let score = 0

    // Name match (highest weight)
    if (event.name.toLowerCase().includes(searchTerm)) {
      score += 10
    }

    // Description match
    if (event.description.toLowerCase().includes(searchTerm)) {
      score += 5
    }

    // Tags match
    event.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(searchTerm)) {
        score += 3
      }
    })

    // Category match
    if (event.category.toLowerCase().includes(searchTerm)) {
      score += 2
    }

    // Popularity bonus
    score += event.popularity * 0.01

    return score
  },

  // Data validation
  validateEvent(event) {
    const required = ["id", "name", "category", "price", "description"]
    const missing = required.filter((field) => !event[field])

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`)
    }

    if (typeof event.price !== "number" || event.price < 0) {
      throw new Error("Price must be a positive number")
    }

    if (!["bodas", "cumpleanos", "bautizos", "baby-shower"].includes(event.category)) {
      throw new Error("Invalid category")
    }

    return true
  },

  validatePackage(pkg) {
    const required = ["id", "name", "price", "features"]
    const missing = required.filter((field) => !pkg[field])

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`)
    }

    if (!pkg.price.min || !pkg.price.max || pkg.price.min > pkg.price.max) {
      throw new Error("Invalid price range")
    }

    if (!Array.isArray(pkg.features) || pkg.features.length === 0) {
      throw new Error("Features must be a non-empty array")
    }

    return true
  },

  // Initialize method
  init() {
    console.log("📊 Data module initialized")

    // Validate data integrity
    try {
      this.events.forEach((event) => this.validateEvent(event))
      this.packages.forEach((pkg) => this.validatePackage(pkg))
      console.log("✅ Data validation passed")
    } catch (error) {
      console.error("❌ Data validation failed:", error)
    }

    // Pre-cache frequently accessed data
    this.getEventStats()
    this.getPackageStats()

    return this
  },
}

// Auto-initialize
Data.init()
