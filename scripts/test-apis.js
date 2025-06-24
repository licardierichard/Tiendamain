// Script para probar todas las APIs manualmente
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function testAPI(endpoint, method, data) {
  console.log(`\n🧪 Probando ${method} ${endpoint}`)

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const result = await response.json()

    if (response.ok) {
      console.log(`✅ ${response.status} - Éxito:`, result)
    } else {
      console.log(`❌ ${response.status} - Error:`, result)
    }

    return { success: response.ok, data: result, status: response.status }
  } catch (error) {
    console.log(`💥 Error de conexión:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runAPITests() {
  console.log("🚀 Iniciando pruebas de APIs...\n")
  console.log(`📍 Base URL: ${BASE_URL}`)

  // Test 1: RSVP API
  await testAPI("/api/rsvp", "POST", {
    eventId: "test-event-123",
    guestName: "Usuario de Prueba",
    guestEmail: "test@example.com",
    attending: true,
    message: "¡Prueba exitosa!",
  })

  // Test 2: Save Invitation API
  await testAPI("/api/save-invitation", "POST", {
    eventType: "boda",
    design: { template: "elegante", colors: ["#gold", "#white"] },
    customization: {
      title: "Nuestra Boda",
      date: "2024-06-15",
      location: "Jardín Botánico",
    },
    guestList: [
      { name: "Juan Pérez", email: "juan@example.com" },
      { name: "María García", email: "maria@example.com" },
    ],
    pricing: { total: 150, currency: "EUR" },
    userId: "user-test-123",
  })

  // Test 3: Get Invitation API (necesita ID real)
  console.log("\n📝 Para probar GET /api/get-invitation, necesitas un ID real de invitación")

  // Test 4: Create Payment Intent
  await testAPI("/api/create-payment-intent", "POST", {
    amount: 25.0,
    currency: "eur",
    metadata: {
      order_id: "test-order-123",
      event_type: "boda",
    },
  })

  // Test 5: Send Email
  await testAPI("/api/send-email", "POST", {
    to: "test@example.com",
    subject: "Prueba de Email",
    template: "test",
    data: {
      name: "Usuario de Prueba",
      message: "Este es un email de prueba",
    },
  })

  console.log("\n✨ Pruebas completadas!")
  console.log("\n📋 Próximos pasos:")
  console.log("1. Verificar que las APIs respondan correctamente")
  console.log("2. Revisar logs de Supabase para errores de BD")
  console.log("3. Probar upload de imágenes manualmente")
  console.log("4. Configurar webhooks de Stripe")
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAPITests().catch(console.error)
}

module.exports = { testAPI, runAPITests }
