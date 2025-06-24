import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { type, orderId, email, data } = req.body

    let emailContent
    let subject
    let to

    switch (type) {
      case "order_confirmation":
        const orderData = await getOrderData(orderId)
        if (!orderData) {
          return res.status(404).json({ error: "Pedido no encontrado" })
        }

        emailContent = generateOrderConfirmationEmail(orderData)
        subject = `Confirmación de Pedido #${orderData.id.slice(0, 8)}`
        to = orderData.user_email
        break

      case "invitation_ready":
        emailContent = generateInvitationReadyEmail(data)
        subject = "Tu invitación está lista"
        to = email
        break

      case "rsvp_notification":
        emailContent = generateRSVPNotificationEmail(data)
        subject = "Nueva respuesta RSVP"
        to = email
        break

      default:
        return res.status(400).json({ error: "Tipo de email no válido" })
    }

    const { data: emailResult, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: emailContent,
    })

    if (error) {
      throw error
    }

    res.status(200).json({
      success: true,
      messageId: emailResult.id,
    })
  } catch (error) {
    console.error("Error enviando email:", error)
    res.status(500).json({
      error: "Error enviando email",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}

async function getOrderData(orderId) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users!inner(email, name)
    `)
    .eq("id", orderId)
    .single()

  if (error) {
    console.error("Error obteniendo datos del pedido:", error)
    return null
  }

  return {
    ...data,
    user_email: data.users.email,
    user_name: data.users.name,
  }
}

function generateOrderConfirmationEmail(order) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirmación de Pedido</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>¡Gracias por tu pedido!</h1>
                <p>Pedido #${order.id.slice(0, 8)}</p>
            </div>
            <div class="content">
                <p>Hola ${order.user_name},</p>
                <p>Hemos recibido tu pedido y lo estamos procesando. Aquí tienes los detalles:</p>
                
                <div class="order-details">
                    <h3>Detalles del Evento</h3>
                    <p><strong>Título:</strong> ${order.event_title}</p>
                    <p><strong>Fecha:</strong> ${order.event_date}</p>
                    <p><strong>Hora:</strong> ${order.event_time}</p>
                    <p><strong>Ubicación:</strong> ${order.event_location}</p>
                    <p><strong>Diseño:</strong> ${order.design_name}</p>
                    <p><strong>Paquete:</strong> ${order.package}</p>
                </div>

                <div class="order-details">
                    <h3>Resumen del Pedido</h3>
                    <p><strong>Subtotal:</strong> €${order.subtotal}</p>
                    <p><strong>IVA:</strong> €${order.tax}</p>
                    <p><strong>Total:</strong> €${order.total}</p>
                </div>

                <p>Te notificaremos cuando tu invitación esté lista para descargar.</p>
            </div>
            <div class="footer">
                <p>© 2024 InviteU.Digital - Invitaciones Digitales Personalizadas</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function generateInvitationReadyEmail(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Tu invitación está lista</title>
    </head>
    <body>
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>¡Tu invitación está lista!</h2>
            <p>Hola ${data.userName},</p>
            <p>Tu invitación para "${data.eventTitle}" ha sido generada exitosamente.</p>
            <p><a href="${data.downloadLink}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Descargar Invitación</a></p>
            <p>El enlace estará disponible por 7 días.</p>
        </div>
    </body>
    </html>
  `
}

function generateRSVPNotificationEmail(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Nueva respuesta RSVP</title>
    </head>
    <body>
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Nueva respuesta RSVP</h2>
            <p>Has recibido una nueva respuesta para tu evento "${data.eventTitle}":</p>
            <p><strong>Invitado:</strong> ${data.guestName}</p>
            <p><strong>Respuesta:</strong> ${data.response}</p>
            <p><strong>Acompañantes:</strong> ${data.companions || 0}</p>
            ${data.message ? `<p><strong>Mensaje:</strong> ${data.message}</p>` : ""}
        </div>
    </body>
    </html>
  `
}
