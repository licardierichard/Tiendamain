import { createClient } from "@supabase/supabase-js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: "ID de invitación requerido" })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase.from("invitations").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Invitación no encontrada" })
      }
      console.error("Error fetching invitation:", error)
      return res.status(500).json({ error: "Error obteniendo invitación" })
    }

    // Parsear JSON fields
    const invitation = {
      ...data,
      design: JSON.parse(data.design || "{}"),
      customization: JSON.parse(data.customization || "{}"),
      guest_list: JSON.parse(data.guest_list || "[]"),
      pricing: JSON.parse(data.pricing || "{}"),
      event_details: JSON.parse(data.event_details || "{}"),
    }

    res.status(200).json({
      success: true,
      data: invitation,
    })
  } catch (error) {
    console.error("Get Invitation API Error:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
