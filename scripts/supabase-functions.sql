-- Función para generar ID único de invitación
CREATE OR REPLACE FUNCTION generate_invitation_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'inv_' || encode(gen_random_bytes(8), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar timestamp de última actividad
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para validar email
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos sensibles
CREATE OR REPLACE FUNCTION cleanup_sensitive_data()
RETURNS void AS $$
BEGIN
  -- Eliminar tokens de verificación expirados
  DELETE FROM verification_tokens 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Limpiar sesiones antiguas
  DELETE FROM auth.sessions 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  -- Limpiar archivos temporales
  UPDATE orders 
  SET invitation_url = NULL, download_expires_at = NULL
  WHERE download_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para estadísticas
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id_param TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (
      SELECT COUNT(*) FROM orders WHERE user_id = user_id_param
    ),
    'completed_orders', (
      SELECT COUNT(*) FROM orders 
      WHERE user_id = user_id_param AND status = 'completed'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(total), 0) FROM orders 
      WHERE user_id = user_id_param AND payment_status = 'completed'
    ),
    'total_rsvps', (
      SELECT COUNT(*) FROM rsvps r
      JOIN orders o ON r.order_id = o.id
      WHERE o.user_id = user_id_param
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
