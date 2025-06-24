-- Ejecutar este script después de create-tables.sql

-- Agregar columnas faltantes si no existen
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invitation_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS download_expires_at TIMESTAMP WITH TIME ZONE;

-- Crear tabla para RSVPs
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'not_attending', 'maybe')),
  companions INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para archivos subidos
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_rsvps_order_id ON rsvps(order_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_order_id ON uploaded_files(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

-- RLS para nuevas tablas
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY rsvps_public_read ON rsvps
  FOR SELECT USING (true);

CREATE POLICY rsvps_public_insert ON rsvps
  FOR INSERT WITH CHECK (true);

CREATE POLICY uploaded_files_owner_access ON uploaded_files
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()::text
    )
  );

-- Función para limpiar archivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_downloads()
RETURNS void AS $$
BEGIN
  UPDATE orders 
  SET invitation_url = NULL, download_expires_at = NULL
  WHERE download_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Programar limpieza automática (requiere pg_cron extension)
-- SELECT cron.schedule('cleanup-downloads', '0 2 * * *', 'SELECT cleanup_expired_downloads();');
