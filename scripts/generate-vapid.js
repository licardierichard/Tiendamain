#!/usr/bin/env node

import webpush from "web-push"
import fs from "fs"

console.log("🔑 Generando claves VAPID...")

const vapidKeys = webpush.generateVAPIDKeys()

console.log("\n📋 Claves VAPID generadas:")
console.log("NEXT_PUBLIC_VAPID_KEY=" + vapidKeys.publicKey)
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey)

// Actualizar .env.local si existe
if (fs.existsSync(".env.local")) {
  let envContent = fs.readFileSync(".env.local", "utf8")

  envContent = envContent.replace(/NEXT_PUBLIC_VAPID_KEY=.*/, `NEXT_PUBLIC_VAPID_KEY=${vapidKeys.publicKey}`)

  envContent = envContent.replace(/VAPID_PRIVATE_KEY=.*/, `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)

  fs.writeFileSync(".env.local", envContent)
  console.log("\n✅ Claves actualizadas en .env.local")
} else {
  console.log("\n⚠️  Agrega estas claves manualmente a tu archivo .env.local")
}
