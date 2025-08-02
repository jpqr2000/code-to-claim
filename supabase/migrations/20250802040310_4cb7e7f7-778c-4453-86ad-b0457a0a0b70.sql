-- Mejoras a la base de datos para el sistema de reservas

-- Primero, agregar campos faltantes a la tabla usuario
ALTER TABLE public.usuario 
ADD COLUMN IF NOT EXISTS telefono VARCHAR,
ADD COLUMN IF NOT EXISTS fecha_reserva TIMESTAMP WITH TIME ZONE;

-- Asegurar que el campo codigo sea único y tenga exactamente 6 dígitos
ALTER TABLE public.usuario 
ADD CONSTRAINT IF NOT EXISTS usuario_codigo_unique UNIQUE (codigo);

-- Agregar campos faltantes a la tabla mesa
ALTER TABLE public.mesa 
ADD COLUMN IF NOT EXISTS nombre VARCHAR,
ADD COLUMN IF NOT EXISTS capacidad INTEGER DEFAULT 8;

-- Agregar campos a la tabla asiento para mejor gestión
ALTER TABLE public.asiento
ADD COLUMN IF NOT EXISTS posicion INTEGER,
ADD COLUMN IF NOT EXISTS ocupado BOOLEAN DEFAULT FALSE;

-- Establecer las foreign keys correctas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_asiento_mesa'
    ) THEN
        ALTER TABLE public.asiento 
        ADD CONSTRAINT fk_asiento_mesa 
        FOREIGN KEY (mesa_id) REFERENCES public.mesa(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_reserva_mesa'
    ) THEN
        ALTER TABLE public.reserva 
        ADD CONSTRAINT fk_reserva_mesa 
        FOREIGN KEY (mesa_id) REFERENCES public.mesa(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_reserva_usuario'
    ) THEN
        ALTER TABLE public.reserva 
        ADD CONSTRAINT fk_reserva_usuario 
        FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Agregar campos para tracking de reservas
ALTER TABLE public.reserva
ADD COLUMN IF NOT EXISTS asiento_id BIGINT,
ADD COLUMN IF NOT EXISTS estado VARCHAR DEFAULT 'confirmada';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_reserva_asiento'
    ) THEN
        ALTER TABLE public.reserva 
        ADD CONSTRAINT fk_reserva_asiento 
        FOREIGN KEY (asiento_id) REFERENCES public.asiento(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para acceso público (ya que no usamos auth de Supabase)
DROP POLICY IF EXISTS "Acceso público a mesas" ON public.mesa;
CREATE POLICY "Acceso público a mesas" 
ON public.mesa 
FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Acceso público a asientos" ON public.asiento;
CREATE POLICY "Acceso público a asientos" 
ON public.asiento 
FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Acceso público a usuarios" ON public.usuario;
CREATE POLICY "Acceso público a usuarios" 
ON public.usuario 
FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Acceso público a reservas" ON public.reserva;
CREATE POLICY "Acceso público a reservas" 
ON public.reserva 
FOR ALL 
USING (true);

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
DROP TRIGGER IF EXISTS trigger_actualizar_asiento_ocupado ON public.reserva;
CREATE TRIGGER trigger_actualizar_asiento_ocupado
    AFTER INSERT OR DELETE ON public.reserva
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_asiento_ocupado();