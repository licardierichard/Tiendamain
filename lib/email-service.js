// Email service for verification and password reset
export const emailService = {
  async sendVerificationEmail(email, token) {
    // In a real application, this would call your backend API
    // For demo purposes, we'll simulate the email sending
    console.log(`Sending verification email to ${email} with token: ${token}`)

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 1000)
    })
  },

  async sendPasswordResetEmail(email, resetLink) {
    console.log(`Sending password reset email to ${email} with link: ${resetLink}`)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 1000)
    })
  },

  async sendOrderConfirmation(email, orderData) {
    console.log(`Sending order confirmation to ${email}`, orderData)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 1000)
    })
  },
}
