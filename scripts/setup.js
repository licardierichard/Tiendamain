#!/usr/bin/env node

import { execSync } from "child_process"
import fs from "fs"

console.log("🚀 Configurando InviteU.Digital...")

// Verificar que existe .env.local
if (!fs.existsSync(".env.local")) {
  console.log("📝 Creando archivo .env.local...")
  fs.copyFileSync(".env.example", ".env.local")
  console.log("⚠️  Por favor, completa las variables en .env.local")
}

// Instalar dependencias si no existen
if (!fs.existsSync("node_modules")) {
  console.log("📦 Instalando dependencias...")
  execSync("npm install", { stdio: "inherit" })
}

// Verificar configuración de Supabase
console.log("🔍 Verificando configuración...")

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
]

const envContent = fs.readFileSync(".env.local", "utf8")
const missingVars = requiredEnvVars.filter(
  (varName) =>
    !envContent.includes(`${varName}=`) ||
    envContent.includes(`${varName}=your-`) ||
    envContent.includes(`${varName}=`),
)

if (missingVars.length > 0) {
  console.log("❌ Variables de entorno faltantes:")
  missingVars.forEach((varName) => console.log(`   - ${varName}`))
  console.log("\n📋 Completa estas variables en .env.local antes de continuar")
  process.exit(1)
}

console.log("✅ Configuración completada!")
console.log("\n📋 Próximos pasos:")
console.log("1. Ejecutar migraciones SQL en Supabase")
console.log("2. Configurar webhooks en Stripe")
console.log("3. Generar claves VAPID")
console.log("4. Ejecutar: npm run dev")
