// Tests para funciones utilitarias
import { formatPrice, validateEmail, generateInvitationId } from "../js/modules/utils.js"

describe("Utility Functions", () => {
  describe("formatPrice", () => {
    test("should format price correctly", () => {
      expect(formatPrice(10.5)).toBe("10,50 €")
      expect(formatPrice(100)).toBe("100,00 €")
      expect(formatPrice(0)).toBe("0,00 €")
    })
  })

  describe("validateEmail", () => {
    test("should validate correct emails", () => {
      expect(validateEmail("test@example.com")).toBe(true)
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true)
    })

    test("should reject invalid emails", () => {
      expect(validateEmail("invalid-email")).toBe(false)
      expect(validateEmail("test@")).toBe(false)
      expect(validateEmail("@domain.com")).toBe(false)
    })
  })

  describe("generateInvitationId", () => {
    test("should generate unique IDs", () => {
      const id1 = generateInvitationId()
      const id2 = generateInvitationId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^inv_[a-f0-9]{16}$/)
      expect(id2).toMatch(/^inv_[a-f0-9]{16}$/)
    })
  })
})
