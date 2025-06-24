// SEO Optimization System
import { Utils } from "./utils.js"

export const SEOOptimizer = {
  initialized: false,
  currentPage: null,
  structuredData: {},

  async init() {
    console.log("🔍 Initializing SEO Optimizer...")

    // Setup dynamic meta tags
    this.setupDynamicMeta()

    // Setup structured data
    this.setupStructuredData()

    // Setup Open Graph tags
    this.setupOpenGraph()

    // Setup Twitter Cards
    this.setupTwitterCards()

    // Setup canonical URLs
    this.setupCanonicalURL()

    // Setup breadcrumbs
    this.setupBreadcrumbs()

    this.initialized = true
    console.log("✅ SEO Optimizer initialized")
  },

  setupDynamicMeta() {
    // Listen for page changes
    document.addEventListener("pageChanged", (e) => {
      this.updatePageMeta(e.detail)
    })

    // Listen for event selection
    document.addEventListener("eventSelected", (e) => {
      this.updateEventMeta(e.detail)
    })
  },

  updatePageMeta(pageData) {
    const { page, title, description, keywords } = pageData

    // Update title
    if (title) {
      document.title = `${title} | InviteU.Digital - Invitaciones Digitales Únicas`
      this.updateMetaTag("og:title", title)
      this.updateMetaTag("twitter:title", title)
    }

    // Update description
    if (description) {
      this.updateMetaTag("description", description)
      this.updateMetaTag("og:description", description)
      this.updateMetaTag("twitter:description", description)
    }

    // Update keywords
    if (keywords) {
      this.updateMetaTag("keywords", keywords.join(", "))
    }

    // Update canonical URL
    this.updateCanonicalURL(window.location.href)

    this.currentPage = page
  },

  updateEventMeta(eventData) {
    const { category, design, name } = eventData

    const title = `${name} - Invitaciones Digitales para ${category}`
    const description = `Crea invitaciones digitales únicas para ${category.toLowerCase()}. Diseño ${design} personalizable con RSVP integrado.`
    const keywords = [
      "invitaciones digitales",
      category.toLowerCase(),
      "invitaciones online",
      "RSVP digital",
      "eventos",
      design.toLowerCase(),
    ]

    this.updatePageMeta({
      page: "event",
      title,
      description,
      keywords,
    })

    // Update structured data for event
    this.updateEventStructuredData(eventData)
  },

  updateMetaTag(name, content) {
    // Handle different meta tag types
    let selector
    if (name.startsWith("og:") || name.startsWith("twitter:")) {
      selector = `meta[property="${name}"]`
    } else {
      selector = `meta[name="${name}"]`
    }

    let metaTag = document.querySelector(selector)

    if (!metaTag) {
      metaTag = document.createElement("meta")
      if (name.startsWith("og:") || name.startsWith("twitter:")) {
        metaTag.setAttribute("property", name)
      } else {
        metaTag.setAttribute("name", name)
      }
      document.head.appendChild(metaTag)
    }

    metaTag.setAttribute("content", content)
  },

  setupStructuredData() {
    // Organization structured data
    this.addStructuredData("Organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "InviteU.Digital",
      description: "Plataforma líder en invitaciones digitales personalizadas para eventos especiales",
      url: window.location.origin,
      logo: `${window.location.origin}/images/logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+34-900-000-000",
        contactType: "customer service",
        availableLanguage: ["Spanish", "English"],
      },
      sameAs: [
        "https://facebook.com/inviteudigital",
        "https://instagram.com/inviteudigital",
        "https://twitter.com/inviteudigital",
      ],
    })

    // Website structured data
    this.addStructuredData("WebSite", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "InviteU.Digital",
      url: window.location.origin,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${window.location.origin}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    })

    // Service structured data
    this.addStructuredData("Service", {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Invitaciones Digitales Personalizadas",
      description: "Creación de invitaciones digitales únicas para bodas, cumpleaños, bautizos y eventos especiales",
      provider: {
        "@type": "Organization",
        name: "InviteU.Digital",
      },
      serviceType: "Digital Invitation Design",
      areaServed: "ES",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Catálogo de Invitaciones",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Invitaciones de Boda",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Invitaciones de Cumpleaños",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Invitaciones de Bautizo",
            },
          },
        ],
      },
    })
  },

  updateEventStructuredData(eventData) {
    const { category, design, name } = eventData

    this.addStructuredData("Product", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `Invitación Digital ${name}`,
      description: `Invitación digital personalizable para ${category.toLowerCase()} con diseño ${design}`,
      category: "Digital Invitations",
      brand: {
        "@type": "Brand",
        name: "InviteU.Digital",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: "15.00",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "InviteU.Digital",
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "127",
      },
    })
  },

  addStructuredData(type, data) {
    const scriptId = `structured-data-${type.toLowerCase()}`

    // Remove existing structured data of this type
    const existingScript = document.getElementById(scriptId)
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement("script")
    script.id = scriptId
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    this.structuredData[type] = data
  },

  setupOpenGraph() {
    // Default Open Graph tags
    const ogTags = {
      "og:site_name": "InviteU.Digital",
      "og:type": "website",
      "og:locale": "es_ES",
      "og:image": `${window.location.origin}/images/og-image.jpg`,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": "InviteU.Digital - Invitaciones Digitales Únicas",
    }

    Object.entries(ogTags).forEach(([property, content]) => {
      this.updateMetaTag(property, content)
    })
  },

  setupTwitterCards() {
    // Twitter Card tags
    const twitterTags = {
      "twitter:card": "summary_large_image",
      "twitter:site": "@inviteudigital",
      "twitter:creator": "@inviteudigital",
      "twitter:image": `${window.location.origin}/images/twitter-card.jpg`,
      "twitter:image:alt": "InviteU.Digital - Invitaciones Digitales Únicas",
    }

    Object.entries(twitterTags).forEach(([name, content]) => {
      this.updateMetaTag(name, content)
    })
  },

  setupCanonicalURL() {
    this.updateCanonicalURL(window.location.href)
  },

  updateCanonicalURL(url) {
    let canonicalLink = document.querySelector('link[rel="canonical"]')

    if (!canonicalLink) {
      canonicalLink = document.createElement("link")
      canonicalLink.rel = "canonical"
      document.head.appendChild(canonicalLink)
    }

    canonicalLink.href = url
  },

  setupBreadcrumbs() {
    // Create breadcrumb container if it doesn't exist
    let breadcrumbContainer = document.querySelector(".breadcrumbs")

    if (!breadcrumbContainer) {
      breadcrumbContainer = Utils.createElement("nav", {
        className: "breadcrumbs",
        ariaLabel: "Breadcrumb navigation",
      })

      // Insert after header or at top of main content
      const header = document.querySelector("header")
      const main = document.querySelector("main")

      if (header && header.nextSibling) {
        header.parentNode.insertBefore(breadcrumbContainer, header.nextSibling)
      } else if (main) {
        main.insertBefore(breadcrumbContainer, main.firstChild)
      }
    }

    this.updateBreadcrumbs()
  },

  updateBreadcrumbs() {
    const breadcrumbContainer = document.querySelector(".breadcrumbs")
    if (!breadcrumbContainer) return

    const path = window.location.pathname
    const breadcrumbs = this.generateBreadcrumbs(path)

    // Update breadcrumb HTML
    breadcrumbContainer.innerHTML = `
      <ol class="breadcrumb-list">
        ${breadcrumbs
          .map(
            (crumb, index) => `
          <li class="breadcrumb-item ${index === breadcrumbs.length - 1 ? "active" : ""}">
            ${
              index === breadcrumbs.length - 1
                ? `<span>${crumb.name}</span>`
                : `<a href="${crumb.url}">${crumb.name}</a>`
            }
          </li>
        `,
          )
          .join("")}
      </ol>
    `

    // Add structured data for breadcrumbs
    this.addBreadcrumbStructuredData(breadcrumbs)
  },

  generateBreadcrumbs(path) {
    const breadcrumbs = [{ name: "Inicio", url: "/" }]

    if (path === "/") {
      return breadcrumbs
    }

    const pathSegments = path.split("/").filter((segment) => segment)
    let currentPath = ""

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      const breadcrumbName = this.getBreadcrumbName(segment, index, pathSegments)
      breadcrumbs.push({
        name: breadcrumbName,
        url: currentPath,
      })
    })

    return breadcrumbs
  },

  getBreadcrumbName(segment, index, pathSegments) {
    // Map URL segments to readable names
    const segmentMap = {
      eventos: "Eventos",
      bodas: "Bodas",
      cumpleanos: "Cumpleaños",
      bautizos: "Bautizos",
      "baby-shower": "Baby Shower",
      panel: "Panel de Usuario",
      rsvp: "RSVP",
      checkout: "Checkout",
      personalizar: "Personalizar",
    }

    return segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  },

  addBreadcrumbStructuredData(breadcrumbs) {
    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${window.location.origin}${crumb.url}`,
      })),
    }

    this.addStructuredData("BreadcrumbList", breadcrumbStructuredData)
  },

  // Generate sitemap data
  generateSitemapData() {
    const pages = [
      { url: "/", priority: 1.0, changefreq: "daily" },
      { url: "/eventos", priority: 0.9, changefreq: "weekly" },
      { url: "/eventos/bodas", priority: 0.8, changefreq: "weekly" },
      { url: "/eventos/cumpleanos", priority: 0.8, changefreq: "weekly" },
      { url: "/eventos/bautizos", priority: 0.8, changefreq: "weekly" },
      { url: "/eventos/baby-shower", priority: 0.8, changefreq: "weekly" },
      { url: "/panel", priority: 0.7, changefreq: "monthly" },
      { url: "/rsvp", priority: 0.6, changefreq: "monthly" },
    ]

    return pages.map((page) => ({
      ...page,
      url: `${window.location.origin}${page.url}`,
      lastmod: new Date().toISOString(),
    }))
  },

  // Optimize images for SEO
  optimizeImages() {
    const images = document.querySelectorAll("img")

    images.forEach((img) => {
      // Add alt text if missing
      if (!img.alt) {
        const src = img.src
        const filename = src.split("/").pop().split(".")[0]
        img.alt = filename.replace(/[-_]/g, " ")
      }

      // Add loading="lazy" for performance
      if (!img.loading) {
        img.loading = "lazy"
      }

      // Add width and height if missing
      if (!img.width && !img.height) {
        img.addEventListener("load", function () {
          this.width = this.naturalWidth
          this.height = this.naturalHeight
        })
      }
    })
  },

  // Generate robots.txt content
  generateRobotsTxt() {
    return `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: ${window.location.origin}/sitemap.xml
    `.trim()
  },

  // Get current SEO status
  getSEOStatus() {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
      structuredData: Object.keys(this.structuredData),
      currentPage: this.currentPage,
    }
  },
}

// Make globally available
if (typeof window !== "undefined") {
  window.SEOOptimizer = SEOOptimizer
}
