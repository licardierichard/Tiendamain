import { createClient } from "@supabase/supabase-js"
import { rateLimit } from "../lib/rate-limit"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 200,
})

export default async function handler(req, res) {
  try {
    await limiter.check(res, 20, "SAVE_INVITATION_CACHE_TOKEN") // 20 requests por minuto
  } catch {
    return res.status(429).json({ error: "Demasiadas solicitudes" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { eventType, design, customization, guestList, pricing, userId, eventDetails, status = "draft" } = req.body

    // Validación robusta
    if (!eventType || !design || !customization) {
      return res.status(400).json({
        error: "Datos requeridos faltantes",
        required: ["eventType", "design", "customization"],
      })
    }

    // Validar estructura de datos
    if (typeof customization !== "object") {
      return res.status(400).json({ error: "Customization debe ser un objeto" })
    }

    if (guestList && !Array.isArray(guestList)) {
      return res.status(400).json({ error: "GuestList debe ser un array" })
    }

    // Conectar a Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Generar ID único para la invitación
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Preparar datos para insertar
    const invitationData = {
      id: invitationId,
      user_id: userId || null,
      event_type: eventType,
      design: JSON.stringify(design),
      customization: JSON.stringify(customization),
      guest_list: JSON.stringify(guestList || []),
      pricing: JSON.stringify(pricing || {}),
      event_details: JSON.stringify(eventDetails || {}),
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("invitations").insert([invitationData]).select()

    if (error) {
      console.error("Error saving invitation:", error)
      return res.status(500).json({
        error: "Error guardando invitación",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }

    // Generar URL de vista previa
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${invitationId}`
    const editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/edit/${invitationId}`

    // Actualizar con URLs
    await supabase
      .from("invitations")
      .update({
        preview_url: previewUrl,
        edit_url: editUrl,
      })
      .eq("id", invitationId)

    res.status(200).json({
      success: true,
      invitationId,
      data: {
        ...data[0],
        preview_url: previewUrl,
        edit_url: editUrl,
      },
      urls: {
        preview: previewUrl,
        edit: editUrl,
      },
      message: "Invitación guardada exitosamente",
    })
  } catch (error) {
    console.error("Save Invitation API Error:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
