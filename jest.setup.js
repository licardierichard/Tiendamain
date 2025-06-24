import jest from "jest"
import "whatwg-fetch"

// Mock de variables de entorno para tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
process.env.STRIPE_SECRET_KEY = "sk_test_test"
process.env.RESEND_API_KEY = "test-api-key"

// Mock de Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_test",
      }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            metadata: { order_id: "test-order" },
          },
        },
      }),
    },
  }))
})

// Mock de Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: "test", email: "test@example.com" },
            error: null,
          }),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    })),
  })),
}))
