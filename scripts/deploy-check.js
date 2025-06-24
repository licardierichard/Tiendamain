// Script para verificar que todo esté listo para deployment
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "NEXT_PUBLIC_APP_URL",
]

function checkEnvironment() {
  console.log("🔍 Verificando configuración de deployment...\n")

  let allGood = true

  // Verificar variables de entorno
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.log(`❌ Falta variable de entorno: ${envVar}`)
      allGood = false
    } else {
      console.log(`✅ ${envVar}`)
    }
  })

  // Verificar archivos críticos
  const fs = require("fs")
  const criticalFiles = [
    "public/manifest.json",
    "public/service-worker.js",
    "api/create-payment-intent.js",
    "api/webhooks/stripe.js",
    "api/send-email.js",
  ]

  console.log("\n📁 Verificando archivos críticos...")
  criticalFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ Falta archivo: ${file}`)
      allGood = false
    }
  })

  if (allGood) {
    console.log("\n🎉 ¡Todo listo para deployment!")
  } else {
    console.log("\n⚠️  Hay elementos pendientes antes del deployment")
    process.exit(1)
  }
}

checkEnvironment()
