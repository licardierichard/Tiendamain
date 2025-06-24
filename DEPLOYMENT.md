# 🚀 Guía de Deployment

## Pre-requisitos

1. ✅ Cuenta en Vercel
2. ✅ Proyecto conectado a Git
3. ✅ Variables de entorno configuradas
4. ✅ APIs probadas localmente

## Pasos de Deployment

### 1. Verificación Pre-Deployment
\`\`\`bash
npm run pre-deploy
\`\`\`

### 2. Build Local (Opcional)
\`\`\`bash
npm run build
npm start
\`\`\`

### 3. Deployment a Vercel
\`\`\`bash
# Primera vez
vercel

# Deployment a producción
vercel --prod
\`\`\`

### 4. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega todas las variables de `.env.production`
4. Redeploy el proyecto

### 5. Configurar Webhooks de Stripe

1. Ve a Stripe Dashboard → Webhooks
2. Crear nuevo endpoint: `https://tudominio.com/api/webhooks/stripe`
3. Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copiar webhook secret a variables de entorno

### 6. Configurar Dominio (Opcional)

\`\`\`bash
npm run setup:domain
\`\`\`

### 7. Verificación Post-Deployment

\`\`\`bash
npm run post-deploy
\`\`\`

## Checklist Final

- [ ] Sitio carga correctamente
- [ ] APIs responden correctamente
- [ ] Webhooks de Stripe funcionan
- [ ] Emails se envían correctamente
- [ ] PWA se instala correctamente
- [ ] Push notifications funcionan
- [ ] Analytics configurado
- [ ] SSL certificado activo

## Comandos Útiles

\`\`\`bash
# Ver logs de deployment
vercel logs

# Ver información del proyecto
vercel inspect

# Rollback a deployment anterior
vercel rollback [deployment-url]
\`\`\`

## Troubleshooting

### Error: Function timeout
- Aumentar `maxDuration` en `vercel.json`

### Error: Environment variables
- Verificar que todas las variables estén configuradas en Vercel

### Error: Webhook
- Verificar que el endpoint esté accesible
- Verificar el webhook secret
