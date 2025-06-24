-- Tabla para imágenes subidas
CREATE TABLE IF NOT EXISTS uploaded_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para uploaded_images
CREATE INDEX IF NOT EXISTS idx_uploaded_images_filename ON uploaded_images(filename);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_created_at ON uploaded_images(created_at);

-- Habilitar RLS
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

-- Política para uploaded_images (permitir lectura pública, escritura autenticada)
CREATE POLICY "Public can view uploaded images" ON uploaded_images
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload images" ON uploaded_images
    FOR INSERT WITH CHECK (true);

-- Actualizar tabla de invitations si es necesario
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS preview_url VARCHAR(500);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS edit_url VARCHAR(500);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS event_details JSONB DEFAULT '{}';

-- Actualizar tabla de rsvps si es necesario  
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para rsvps
DROP TRIGGER IF EXISTS update_rsvps_updated_at ON rsvps;
CREATE TRIGGER update_rsvps_updated_at
    BEFORE UPDATE ON rsvps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para invitations
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
