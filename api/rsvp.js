import { createClient } from "@supabase/supabase-js"
import { rateLimit } from "../lib/rate-limit"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
})

export default async function handler(req, res) {
  try {
    await limiter.check(res, 10, "RSVP_CACHE_TOKEN") // 10 requests por minuto
  } catch {
    return res.status(429).json({ error: "Demasiadas solicitudes" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { eventId, guestName, guestEmail, attending, message, phone } = req.body

    // Validación robusta
    if (!eventId || !guestName || !guestEmail || attending === undefined) {
      return res.status(400).json({
        error: "Datos requeridos faltantes",
        required: ["eventId", "guestName", "guestEmail", "attending"],
      })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      return res.status(400).json({ error: "Email inválido" })
    }

    // Conectar a Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Verificar si ya existe RSVP
    const { data: existingRsvp } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", eventId)
      .eq("guest_email", guestEmail)
      .single()

    let result
    if (existingRsvp) {
      // Actualizar RSVP existente
      const { data, error } = await supabase
        .from("rsvps")
        .update({
          guest_name: guestName,
          attending,
          message: message || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRsvp.id)
        .select()

      result = { data, error, action: "updated" }
    } else {
      // Crear nuevo RSVP
      const { data, error } = await supabase
        .from("rsvps")
        .insert([
          {
            event_id: eventId,
            guest_name: guestName,
            guest_email: guestEmail,
            attending,
            message: message || null,
            phone: phone || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      result = { data, error, action: "created" }
    }

    if (result.error) {
      console.error("Error saving RSVP:", result.error)
      return res.status(500).json({ error: "Error guardando RSVP" })
    }

    // Enviar email de confirmación
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: guestEmail,
          subject: attending ? "✅ RSVP Confirmado" : "❌ RSVP Declinado",
          template: "rsvp-confirmation",
          data: {
            guestName,
            attending,
            eventId,
            message: message || "",
            action: result.action,
          },
        }),
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // No fallar la API si el email falla
    }

    res.status(200).json({
      success: true,
      data: result.data[0],
      action: result.action,
      message: `RSVP ${result.action === "created" ? "creado" : "actualizado"} exitosamente`,
    })
  } catch (error) {
    console.error("RSVP API Error:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
