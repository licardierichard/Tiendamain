// Sistema básico de monitoreo y logging
class Monitor {
  constructor() {
    this.errors = []
    this.metrics = {
      pageViews: 0,
      apiCalls: 0,
      errors: 0,
      performance: [],
    }
  }

  // Registrar error
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : context.url,
    }

    this.errors.push(errorLog)
    this.metrics.errors++

    // En producción, enviar a servicio de monitoreo
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoringService(errorLog)
    } else {
      console.error("Monitor Error:", errorLog)
    }
  }

  // Registrar métrica de rendimiento
  logPerformance(name, duration, metadata = {}) {
    const perfLog = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    }

    this.metrics.performance.push(perfLog)

    // Mantener solo las últimas 100 métricas
    if (this.metrics.performance.length > 100) {
      this.metrics.performance = this.metrics.performance.slice(-100)
    }
  }

  // Registrar vista de página
  logPageView(path) {
    this.metrics.pageViews++

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
        page_path: path,
      })
    }
  }

  // Registrar llamada a API
  logApiCall(endpoint, method, duration, status) {
    this.metrics.apiCalls++

    this.logPerformance(`api_${method.toLowerCase()}_${endpoint}`, duration, {
      status,
      endpoint,
      method,
    })
  }

  // Obtener estadísticas
  getStats() {
    return {
      ...this.metrics,
      errorRate: this.metrics.errors / (this.metrics.apiCalls || 1),
      avgPerformance:
        this.metrics.performance.reduce((acc, p) => acc + p.duration, 0) / (this.metrics.performance.length || 1),
    }
  }

  // Enviar a servicio de monitoreo (implementar según necesidades)
  async sendToMonitoringService(data) {
    try {
      // Ejemplo con un servicio genérico
      await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("Error enviando datos de monitoreo:", error)
    }
  }
}

// Instancia global
const monitor = new Monitor()

// Hook para React
export function useMonitoring() {
  return {
    logError: monitor.logError.bind(monitor),
    logPerformance: monitor.logPerformance.bind(monitor),
    logPageView: monitor.logPageView.bind(monitor),
    getStats: monitor.getStats.bind(monitor),
  }
}

export default monitor
