import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { amount, currency = "eur", metadata = {} } = req.body

    // Validar datos requeridos
    if (!amount || amount < 50) {
      return res.status(400).json({
        error: "Monto inválido. Mínimo 0.50 EUR",
      })
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      metadata: {
        ...metadata,
        source: "inviteu_digital",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creando Payment Intent:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
