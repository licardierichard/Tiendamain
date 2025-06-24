// Tests para APIs críticas
import { createMocks } from "node-mocks-http"
import handler from "../api/create-payment-intent.js"

describe("/api/create-payment-intent", () => {
  test("should create payment intent successfully", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        amount: 10.0,
        currency: "eur",
        metadata: {
          order_id: "test-order-123",
        },
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty("clientSecret")
    expect(data).toHaveProperty("paymentIntentId")
  })

  test("should reject invalid amount", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        amount: 0.25, // Menos del mínimo
        currency: "eur",
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty("error")
  })

  test("should reject non-POST requests", async () => {
    const { req, res } = createMocks({
      method: "GET",
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
