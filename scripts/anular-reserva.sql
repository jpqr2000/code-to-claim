-- Script para anular una reserva específica por número de mesa y asiento
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Parámetros: Cambiar los valores de @mesa_numero y @asiento_numero

-- Definir variables (cambiar estos valores según la reserva a anular)
DO $$
DECLARE
    mesa_numero_param INTEGER := 1; -- Cambiar por el número de mesa
    asiento_numero_param INTEGER := 1; -- Cambiar por el número de asiento
    reserva_encontrada RECORD;
    mesa_encontrada INTEGER;
    asiento_encontrado INTEGER;
BEGIN
    -- Buscar la mesa
    SELECT id INTO mesa_encontrada 
    FROM public.mesa 
    WHERE numero = mesa_numero_param;
    
    IF mesa_encontrada IS NULL THEN
        RAISE NOTICE 'Error: No se encontró la mesa número %', mesa_numero_param;
        RETURN;
    END IF;
    
    -- Buscar el asiento
    SELECT id INTO asiento_encontrado 
    FROM public.asiento 
    WHERE mesa_id = mesa_encontrada AND numero = asiento_numero_param;
    
    IF asiento_encontrado IS NULL THEN
        RAISE NOTICE 'Error: No se encontró el asiento número % en la mesa %', asiento_numero_param, mesa_numero_param;
        RETURN;
    END IF;
    
    -- Buscar la reserva activa
    SELECT r.*, u.codigo, u.nombres, u.apellidos 
    INTO reserva_encontrada
    FROM public.reserva r
    JOIN public.usuario u ON r.usuario_id = u.id
    WHERE r.mesa_id = mesa_encontrada 
    AND r.asiento_id = asiento_encontrado
    AND r.estado = 'confirmada';
    
    IF reserva_encontrada IS NULL THEN
        RAISE NOTICE 'No hay reserva activa para el asiento % de la mesa %', asiento_numero_param, mesa_numero_param;
        RETURN;
    END IF;
    
    -- Mostrar información de la reserva antes de anular
    RAISE NOTICE 'Anulando reserva:';
    RAISE NOTICE '- Mesa: % (%)', mesa_numero_param, (SELECT nombre FROM public.mesa WHERE id = mesa_encontrada);
    RAISE NOTICE '- Asiento: %', asiento_numero_param;
    RAISE NOTICE '- Usuario: % (código: %)', 
        COALESCE(reserva_encontrada.nombres || ' ' || reserva_encontrada.apellidos, 'Sin nombre'), 
        reserva_encontrada.codigo;
    
    -- Anular la reserva (eliminarla)
    DELETE FROM public.reserva 
    WHERE id = reserva_encontrada.id;
    
    -- Actualizar el estado del usuario
    UPDATE public.usuario 
    SET reservado = FALSE 
    WHERE id = reserva_encontrada.usuario_id;
    
    -- El trigger automáticamente marcará el asiento como libre
    
    RAISE NOTICE 'Reserva anulada exitosamente';
    
    -- Verificar estado final
    RAISE NOTICE 'Estado del asiento después de anular: %', 
        (SELECT ocupado FROM public.asiento WHERE id = asiento_encontrado);
        
END $$;

-- Consulta para verificar el resultado
SELECT 
    m.numero as mesa_numero,
    m.nombre as mesa_nombre,
    a.numero as asiento_numero,
    a.ocupado as asiento_ocupado,
    CASE 
        WHEN r.id IS NOT NULL THEN 'Reservado'
        ELSE 'Libre'
    END as estado_reserva
FROM public.mesa m
JOIN public.asiento a ON m.id = a.mesa_id
LEFT JOIN public.reserva r ON r.mesa_id = m.id AND r.asiento_id = a.id AND r.estado = 'confirmada'
WHERE m.numero = 1 AND a.numero = 1; -- Cambiar por los números usados arriba