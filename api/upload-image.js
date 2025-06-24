import { createClient } from "@supabase/supabase-js"
import formidable from "formidable"
import fs from "fs"
import path from "path"
import { rateLimit } from "../lib/rate-limit"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 100,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  try {
    await limiter.check(res, 5, "UPLOAD_CACHE_TOKEN") // 5 uploads por minuto
  } catch {
    return res.status(429).json({ error: "Demasiadas solicitudes de upload" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
      filter: ({ name, originalFilename, mimetype }) => {
        // Filtrar solo imágenes
        return mimetype && mimetype.includes("image")
      },
    })

    const [fields, files] = await form.parse(req)
    const file = files.image?.[0]

    if (!file) {
      return res.status(400).json({ error: "No se encontró archivo de imagen" })
    }

    // Validar tipo de archivo más estricto
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: "Tipo de archivo no permitido",
        allowed: allowedTypes,
      })
    }

    // Validar tamaño de archivo
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Archivo demasiado grande (máximo 10MB)" })
    }

    // Conectar a Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Leer archivo
    const fileBuffer = fs.readFileSync(file.filepath)

    // Generar nombre único
    const fileExtension = path.extname(file.originalFilename || ".jpg")
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`
    const filePath = `uploads/${fileName}`

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage.from("images").upload(filePath, fileBuffer, {
      contentType: file.mimetype,
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return res.status(500).json({
        error: "Error subiendo imagen",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      })
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath)

    // Limpiar archivo temporal
    try {
      fs.unlinkSync(file.filepath)
    } catch (cleanupError) {
      console.warn("Error cleaning up temp file:", cleanupError)
    }

    // Guardar metadata en base de datos
    const { data: imageRecord, error: dbError } = await supabase
      .from("uploaded_images")
      .insert([
        {
          filename: fileName,
          original_name: file.originalFilename,
          file_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()

    if (dbError) {
      console.error("Database error:", dbError)
      // No fallar si no se puede guardar metadata
    }

    res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      originalName: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      id: imageRecord?.[0]?.id,
    })
  } catch (error) {
    console.error("Upload API Error:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
