const fs = require("fs")
const path = require("path")

const requiredFiles = [
  "api/rsvp.js",
  "api/upload-image.js",
  "api/save-invitation.js",
  "api/get-invitation.js",
  "api/create-payment-intent.js",
  "api/webhooks/stripe.js",
  "api/send-email.js",
  "lib/rate-limit.js",
  "public/manifest.json",
  "public/service-worker.js",
  "vercel.json",
]

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

function checkPreDeployment() {
  console.log("🔍 Verificación pre-deployment...\n")

  let allGood = true

  // Verificar archivos
  console.log("📁 Verificando archivos críticos:")
  requiredFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ FALTA: ${file}`)
      allGood = false
    }
  })

  // Verificar variables de entorno
  console.log("\n🔐 Verificando variables de entorno:")
  requiredEnvVars.forEach((envVar) => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}`)
    } else {
      console.log(`❌ FALTA: ${envVar}`)
      allGood = false
    }
  })

  // Verificar package.json
  console.log("\n📦 Verificando dependencias:")
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"))
    const requiredDeps = ["formidable", "@supabase/supabase-js", "stripe", "resend", "web-push"]

    requiredDeps.forEach((dep) => {
      if (pkg.dependencies[dep]) {
        console.log(`✅ ${dep}`)
      } else {
        console.log(`❌ FALTA DEPENDENCIA: ${dep}`)
        allGood = false
      }
    })
  } catch (error) {
    console.log("❌ Error leyendo package.json")
    allGood = false
  }

  if (allGood) {
    console.log("\n🎉 ¡Todo listo para deployment!")
    console.log("\n📋 Comandos para deployment:")
    console.log("1. npm run build")
    console.log("2. vercel --prod")
    console.log("\n🔗 No olvides configurar:")
    console.log("- Variables de entorno en Vercel")
    console.log("- Webhooks de Stripe")
    console.log("- Dominio personalizado (opcional)")
  } else {
    console.log("\n⚠️ Hay elementos pendientes antes del deployment")
    process.exit(1)
  }
}

checkPreDeployment()
