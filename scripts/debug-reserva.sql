-- Script de debugging para crear UNA sola reserva paso a paso
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Este script ayuda a identificar dónde está el problema exacto

-- PASO 1: Verificar estado inicial
SELECT 'ESTADO INICIAL DE LA BASE DE DATOS' as info;

SELECT 
    'Usuarios totales: ' || COUNT(*)::TEXT as conteo
FROM public.usuario
UNION ALL
SELECT 
    'Usuarios sin reserva: ' || COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = FALSE
UNION ALL
SELECT 
    'Asientos totales: ' || COUNT(*)::TEXT
FROM public.asiento
UNION ALL
SELECT 
    'Asientos libres: ' || COUNT(*)::TEXT
FROM public.asiento
WHERE ocupado = FALSE
UNION ALL
SELECT 
    'Reservas existentes: ' || COUNT(*)::TEXT
FROM public.reserva;

-- PASO 2: Mostrar un usuario de ejemplo sin reserva
SELECT 'USUARIO DE EJEMPLO SIN RESERVA' as info;

SELECT 
    id, codigo, nombres, apellidos, reservado
FROM public.usuario 
WHERE reservado = FALSE 
LIMIT 1;

-- PASO 3: Mostrar un asiento de ejemplo libre
SELECT 'ASIENTO DE EJEMPLO LIBRE' as info;

SELECT 
    a.id, a.numero as asiento_numero, a.ocupado, 
    m.numero as mesa_numero, m.nombre as mesa_nombre
FROM public.asiento a
JOIN public.mesa m ON a.mesa_id = m.id
WHERE a.ocupado = FALSE
LIMIT 1;

-- PASO 4: Intentar crear UNA reserva manualmente paso a paso
DO $$
DECLARE
    test_usuario RECORD;
    test_asiento RECORD;
    nueva_reserva_id INTEGER;
BEGIN
    RAISE NOTICE '=== INICIANDO CREACIÓN DE RESERVA DE PRUEBA ===';
    
    -- Seleccionar primer usuario sin reserva
    SELECT * INTO test_usuario
    FROM public.usuario 
    WHERE reservado = FALSE 
    LIMIT 1;
    
    IF test_usuario IS NULL THEN
        RAISE NOTICE 'ERROR: No hay usuarios sin reserva disponibles';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuario seleccionado: ID=%, Código=%, Reservado=%', 
        test_usuario.id, test_usuario.codigo, test_usuario.reservado;
    
    -- Seleccionar primer asiento libre
    SELECT a.*, m.numero as mesa_numero, m.nombre as mesa_nombre
    INTO test_asiento
    FROM public.asiento a
    JOIN public.mesa m ON a.mesa_id = m.id
    WHERE a.ocupado = FALSE
    LIMIT 1;
    
    IF test_asiento IS NULL THEN
        RAISE NOTICE 'ERROR: No hay asientos libres disponibles';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Asiento seleccionado: ID=%, Mesa=%, Asiento=%, Ocupado=%', 
        test_asiento.id, test_asiento.mesa_numero, test_asiento.numero, test_asiento.ocupado;
    
    -- PASO A: Actualizar datos del usuario
    BEGIN
        UPDATE public.usuario 
        SET 
            nombres = 'Juan',
            apellidos = 'Pérez García',
            dni = '12345678A',
            correo = 'juan.perez@test.com',
            telefono = '612345678',
            reservado = TRUE
        WHERE id = test_usuario.id;
        
        RAISE NOTICE 'PASO A COMPLETADO: Usuario actualizado con datos';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR EN PASO A: %', SQLERRM;
        RETURN;
    END;
    
    -- PASO B: Marcar asiento como ocupado
    BEGIN
        UPDATE public.asiento 
        SET ocupado = TRUE 
        WHERE id = test_asiento.id;
        
        RAISE NOTICE 'PASO B COMPLETADO: Asiento marcado como ocupado';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR EN PASO B: %', SQLERRM;
        RETURN;
    END;
    
    -- PASO C: Crear la reserva
    BEGIN
        INSERT INTO public.reserva (usuario_id, mesa_id, asiento_id, estado)
        VALUES (
            test_usuario.id, 
            test_asiento.mesa_id, 
            test_asiento.id, 
            'confirmada'
        )
        RETURNING id INTO nueva_reserva_id;
        
        RAISE NOTICE 'PASO C COMPLETADO: Reserva creada con ID=%', nueva_reserva_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR EN PASO C: %', SQLERRM;
        RAISE NOTICE 'Código de error: %', SQLSTATE;
        RETURN;
    END;
    
    RAISE NOTICE '=== RESERVA DE PRUEBA CREADA EXITOSAMENTE ===';
    RAISE NOTICE 'ID Reserva: %', nueva_reserva_id;
    RAISE NOTICE 'Usuario: % (código: %)', test_usuario.id, test_usuario.codigo;
    RAISE NOTICE 'Mesa: %, Asiento: %', test_asiento.mesa_numero, test_asiento.numero;
    
END $$;

-- PASO 5: Verificar estado después de la prueba
SELECT 'ESTADO DESPUÉS DE LA PRUEBA' as info;

SELECT 
    'Reservas totales ahora: ' || COUNT(*)::TEXT as resultado
FROM public.reserva
UNION ALL
SELECT 
    'Asientos ocupados ahora: ' || COUNT(*)::TEXT
FROM public.asiento
WHERE ocupado = TRUE
UNION ALL
SELECT 
    'Usuarios reservados ahora: ' || COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = TRUE;

-- PASO 6: Mostrar la reserva creada (si existe)
SELECT 'RESERVA CREADA (SI EXISTE)' as info;

SELECT 
    r.id as reserva_id,
    r.estado,
    u.codigo as usuario_codigo,
    u.nombres,
    u.apellidos,
    m.numero as mesa_numero,
    a.numero as asiento_numero
FROM public.reserva r
JOIN public.usuario u ON r.usuario_id = u.id
JOIN public.mesa m ON r.mesa_id = m.id
JOIN public.asiento a ON r.asiento_id = a.id
ORDER BY r.id DESC
LIMIT 1;