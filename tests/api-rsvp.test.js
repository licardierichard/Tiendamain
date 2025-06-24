import { createMocks } from "node-mocks-http"
import handler from "../api/rsvp.js"
import jest from "jest" // Declare the jest variable

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() =>
          Promise.resolve({
            data: [{ id: "test-rsvp-123", guest_name: "Test User" }],
            error: null,
          }),
        ),
      })),
    })),
  })),
}))

// Mock fetch para email
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  }),
)

describe("/api/rsvp", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should create RSVP successfully", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        eventId: "event-123",
        guestName: "Juan Pérez",
        guestEmail: "juan@example.com",
        attending: true,
        message: "¡Estaré ahí!",
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.action).toBe("created")
  })

  test("should reject invalid email", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        eventId: "event-123",
        guestName: "Juan Pérez",
        guestEmail: "email-invalido",
        attending: true,
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe("Email inválido")
  })

  test("should reject missing required fields", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        guestName: "Juan Pérez",
        // Falta eventId, guestEmail, attending
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe("Datos requeridos faltantes")
  })

  test("should reject non-POST requests", async () => {
    const { req, res } = createMocks({
      method: "GET",
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
