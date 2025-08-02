-- Mejoras a la base de datos para el sistema de reservas

-- Primero, agregar campos faltantes a la tabla usuario
ALTER TABLE public.usuario 
ADD COLUMN IF NOT EXISTS telefono VARCHAR,
ADD COLUMN IF NOT EXISTS fecha_reserva TIMESTAMP WITH TIME ZONE;

-- Asegurar que el campo codigo sea único y tenga exactamente 6 dígitos
ALTER TABLE public.usuario 
ADD CONSTRAINT usuario_codigo_unique UNIQUE (codigo),
ADD CONSTRAINT usuario_codigo_length CHECK (LENGTH(codigo) = 6 AND codigo ~ '^[0-9]{6}$');

-- Agregar campos faltantes a la tabla mesa
ALTER TABLE public.mesa 
ADD COLUMN IF NOT EXISTS nombre VARCHAR,
ADD COLUMN IF NOT EXISTS capacidad INTEGER DEFAULT 8;

-- Agregar campos a la tabla asiento para mejor gestión
ALTER TABLE public.asiento
ADD COLUMN IF NOT EXISTS posicion INTEGER,
ADD COLUMN IF NOT EXISTS ocupado BOOLEAN DEFAULT FALSE;

-- Establecer las foreign keys correctas
ALTER TABLE public.asiento 
ADD CONSTRAINT fk_asiento_mesa 
FOREIGN KEY (mesa_id) REFERENCES public.mesa(id) ON DELETE CASCADE;

ALTER TABLE public.reserva 
ADD CONSTRAINT fk_reserva_mesa 
FOREIGN KEY (mesa_id) REFERENCES public.mesa(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_reserva_usuario 
FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;

-- Agregar campos para tracking de reservas
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS asiento_id BIGINT,
ADD COLUMN IF NOT EXISTS estado VARCHAR DEFAULT 'confirmada';

ALTER TABLE public.reserva 
ADD CONSTRAINT fk_reserva_asiento 
FOREIGN KEY (asiento_id) REFERENCES public.asiento(id) ON DELETE SET NULL;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para acceso público (ya que no usamos auth de Supabase)
-- Política para mesa - lectura pública
CREATE POLICY "Acceso público a mesas" 
ON public.mesa 
FOR ALL 
USING (true);

-- Política para asiento - lectura y actualización pública
CREATE POLICY "Acceso público a asientos" 
ON public.asiento 
FOR ALL 
USING (true);

-- Política para usuario - acceso completo
CREATE POLICY "Acceso público a usuarios" 
ON public.usuario 
FOR ALL 
USING (true);

-- Política para reserva - acceso completo
CREATE POLICY "Acceso público a reservas" 
ON public.reserva 
FOR ALL 
USING (true);

-- Insertar datos de ejemplo para testing (mesas y asientos)
INSERT INTO public.mesa (numero, nombre, capacidad) VALUES 
(1, 'Mesa Principal', 8),
(2, 'Mesa VIP', 6),
(3, 'Mesa Lateral A', 8),
(4, 'Mesa Lateral B', 8),
(5, 'Mesa Centro', 10)
ON CONFLICT (numero) DO NOTHING;

-- Insertar asientos para cada mesa
DO $$
DECLARE
    mesa_record RECORD;
    i INTEGER;
BEGIN
    FOR mesa_record IN SELECT id, numero, capacidad FROM public.mesa LOOP
        FOR i IN 1..mesa_record.capacidad LOOP
            INSERT INTO public.asiento (numero, mesa_id, posicion, ocupado)
            VALUES (i, mesa_record.id, i, FALSE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Crear algunos códigos de usuario de ejemplo para testing
INSERT INTO public.usuario (codigo, nombres, apellidos, dni, correo, telefono, reservado) VALUES 
('123456', NULL, NULL, NULL, NULL, NULL, FALSE),
('654321', NULL, NULL, NULL, NULL, NULL, FALSE),
('111111', NULL, NULL, NULL, NULL, NULL, FALSE),
('222222', NULL, NULL, NULL, NULL, NULL, FALSE),
('333333', NULL, NULL, NULL, NULL, NULL, FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- Función para actualizar el estado de ocupado en asientos
CREATE OR REPLACE FUNCTION public.actualizar_asiento_ocupado()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Marcar asiento como ocupado
        UPDATE public.asiento 
        SET ocupado = TRUE 
        WHERE id = NEW.asiento_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Marcar asiento como libre
        UPDATE public.asiento 
        SET ocupado = FALSE 
        WHERE id = OLD.asiento_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el estado de los asientos
CREATE TRIGGER trigger_actualizar_asiento_ocupado
    AFTER INSERT OR DELETE ON public.reserva
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_asiento_ocupado();