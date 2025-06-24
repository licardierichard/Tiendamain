import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { buffer } from "micro"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const buf = await buffer(req)
  const sig = req.headers["stripe-signature"]

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Error verificando webhook:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object)
        break

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error("Error procesando webhook:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
}

async function handlePaymentSuccess(paymentIntent) {
  const { metadata } = paymentIntent

  if (metadata.order_id) {
    // Actualizar estado del pedido
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "completed",
        status: "processing",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", metadata.order_id)

    if (error) {
      console.error("Error actualizando pedido:", error)
      throw error
    }

    // Enviar email de confirmación
    await sendConfirmationEmail(metadata.order_id)
  }
}

async function handlePaymentFailed(paymentIntent) {
  const { metadata } = paymentIntent

  if (metadata.order_id) {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        status: "cancelled",
      })
      .eq("id", metadata.order_id)

    if (error) {
      console.error("Error actualizando pedido fallido:", error)
    }
  }
}

async function sendConfirmationEmail(orderId) {
  // Implementar envío de email de confirmación
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_confirmation",
        orderId,
      }),
    })

    if (!response.ok) {
      throw new Error("Error enviando email de confirmación")
    }
  } catch (error) {
    console.error("Error enviando email:", error)
  }
}
