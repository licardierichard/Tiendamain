// Rate limiting para APIs
const rateLimitMap = new Map()

export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const windowStart = now - windowMs

  // Limpiar entradas antiguas
  const requests = rateLimitMap.get(identifier) || []
  const validRequests = requests.filter((time) => time > windowStart)

  if (validRequests.length >= limit) {
    return false // Rate limit exceeded
  }

  // Agregar nueva request
  validRequests.push(now)
  rateLimitMap.set(identifier, validRequests)

  return true // Request allowed
}

export function getRateLimitMiddleware(limit = 10, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress || "unknown"

    if (!rateLimit(identifier, limit, windowMs)) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil(windowMs / 1000),
      })
    }

    if (next) next()
  }
}
