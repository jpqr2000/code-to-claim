-- Script para simular 95 reservas completas con datos de usuarios
-- Ejecutar DESPUÉS de seed-database.sql para simular reservas reales
-- Ejecutar en Supabase Dashboard > SQL Editor

-- VERSIÓN CORREGIDA - Basada en la lógica que funciona del debug-reserva.sql

DO $$
DECLARE
    total_reservas INTEGER := 95; -- Cambiar por el número deseado
    reservas_creadas INTEGER := 0;
    test_usuario RECORD;
    test_asiento RECORD;
    nueva_reserva_id INTEGER;
    
    -- Arrays de nombres y apellidos realistas
    nombres_masculinos TEXT[] := ARRAY['Carlos', 'José', 'Luis', 'Miguel', 'Juan', 'Antonio', 'Francisco', 'Manuel', 'Rafael', 'Pedro', 'Daniel', 'Alejandro', 'Fernando', 'Ricardo', 'Roberto', 'Eduardo', 'Alberto', 'Javier', 'Andrés', 'Diego'];
    nombres_femeninos TEXT[] := ARRAY['María', 'Ana', 'Laura', 'Carmen', 'Isabel', 'Patricia', 'Rosa', 'Elena', 'Lucía', 'Andrea', 'Gabriela', 'Sofía', 'Valentina', 'Camila', 'Alejandra', 'Natalia', 'Carolina', 'Daniela', 'Fernanda', 'Paola'];
    apellidos TEXT[] := ARRAY['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez'];
    
    -- Variables para generar datos
    nombre_completo TEXT;
    apellido_completo TEXT;
    dni_generado TEXT;
    correo_generado TEXT;
    telefono_generado TEXT;
    es_masculino BOOLEAN;
    
BEGIN
    RAISE NOTICE '=== INICIANDO SIMULACIÓN DE % RESERVAS ===', total_reservas;
    
    -- Bucle para crear reservas
    FOR i IN 1..total_reservas LOOP
        
        -- Seleccionar usuario sin reserva
        SELECT * INTO test_usuario
        FROM public.usuario 
        WHERE reservado = FALSE 
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Si no hay más usuarios, salir
        IF test_usuario IS NULL THEN
            RAISE NOTICE 'No hay más usuarios disponibles. Reservas creadas: %', reservas_creadas;
            EXIT;
        END IF;
        
        -- Seleccionar asiento libre
        SELECT a.*, m.numero as mesa_numero, m.nombre as mesa_nombre, m.id as mesa_id
        INTO test_asiento
        FROM public.asiento a
        JOIN public.mesa m ON a.mesa_id = m.id
        WHERE a.ocupado = FALSE
        ORDER BY RANDOM()
        LIMIT 1;
        
        -- Si no hay más asientos, salir
        IF test_asiento IS NULL THEN
            RAISE NOTICE 'No hay más asientos disponibles. Reservas creadas: %', reservas_creadas;
            EXIT;
        END IF;
        
        -- Generar datos realistas para el usuario
        es_masculino := (RANDOM() > 0.5);
        
        IF es_masculino THEN
            nombre_completo := nombres_masculinos[1 + FLOOR(RANDOM() * array_length(nombres_masculinos, 1))];
        ELSE
            nombre_completo := nombres_femeninos[1 + FLOOR(RANDOM() * array_length(nombres_femeninos, 1))];
        END IF;
        
        apellido_completo := apellidos[1 + FLOOR(RANDOM() * array_length(apellidos, 1))];
        IF RANDOM() > 0.3 THEN
            apellido_completo := apellido_completo || ' ' || apellidos[1 + FLOOR(RANDOM() * array_length(apellidos, 1))];
        END IF;
        
        dni_generado := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0') || CHR((65 + FLOOR(RANDOM() * 26))::INTEGER);
        correo_generado := LOWER(nombre_completo) || '.' || LOWER(SPLIT_PART(apellido_completo, ' ', 1)) || FLOOR(RANDOM() * 100)::TEXT || '@gmail.com';
        telefono_generado := (600000000 + FLOOR(RANDOM() * 399999999))::TEXT;
        
        -- Crear la reserva paso a paso (igual que en debug-reserva.sql)
        BEGIN
            -- PASO A: Actualizar usuario
            UPDATE public.usuario 
            SET 
                nombres = nombre_completo,
                apellidos = apellido_completo,
                dni = dni_generado,
                correo = correo_generado,
                telefono = telefono_generado,
                reservado = TRUE
            WHERE id = test_usuario.id;
            
            -- PASO B: Marcar asiento como ocupado
            UPDATE public.asiento 
            SET ocupado = TRUE 
            WHERE id = test_asiento.id;
            
            -- PASO C: Crear la reserva
            INSERT INTO public.reserva (usuario_id, mesa_id, asiento_id, estado)
            VALUES (
                test_usuario.id, 
                test_asiento.mesa_id, 
                test_asiento.id, 
                'confirmada'
            )
            RETURNING id INTO nueva_reserva_id;
            
            reservas_creadas := reservas_creadas + 1;
            
            -- Mostrar progreso cada 10 reservas
            IF reservas_creadas % 10 = 0 THEN
                RAISE NOTICE 'Progreso: % / % reservas creadas (Última: % % - Mesa %, Asiento %)', 
                    reservas_creadas, total_reservas, nombre_completo, apellido_completo, 
                    test_asiento.mesa_numero, test_asiento.numero;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error en reserva %: % (SQLSTATE: %)', i, SQLERRM, SQLSTATE;
            -- No hacer rollback, continuar con la siguiente
        END;
        
    END LOOP;
    
    RAISE NOTICE '=== SIMULACIÓN COMPLETADA ===';
    RAISE NOTICE 'Reservas objetivo: %', total_reservas;
    RAISE NOTICE 'Reservas creadas exitosamente: %', reservas_creadas;
    
END $$;

-- ===============================================
-- VERIFICACIÓN DE RESULTADOS
-- ===============================================

-- Conteo final
SELECT 
    '=== RESUMEN FINAL ===' as titulo,
    '' as valor
UNION ALL
SELECT 
    'Total reservas creadas',
    COUNT(*)::TEXT
FROM public.reserva
UNION ALL
SELECT 
    'Total asientos ocupados',
    COUNT(*)::TEXT
FROM public.asiento
WHERE ocupado = TRUE
UNION ALL
SELECT 
    'Total usuarios con reserva',
    COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = TRUE AND nombres IS NOT NULL;

-- Primeras 15 reservas creadas
SELECT 
    '=== PRIMERAS 15 RESERVAS CREADAS ===' as titulo;

SELECT 
    ('Reserva ' || r.id || ': Mesa ' || m.numero || ', Asiento ' || a.numero || 
     ' - ' || u.nombres || ' ' || u.apellidos || ' (' || u.codigo || ')') as detalle
FROM public.reserva r
JOIN public.usuario u ON r.usuario_id = u.id
JOIN public.mesa m ON r.mesa_id = m.id
JOIN public.asiento a ON r.asiento_id = a.id
WHERE r.estado = 'confirmada'
ORDER BY r.id
LIMIT 15;

-- Verificación de integridad
SELECT 
    '=== VERIFICACIÓN DE INTEGRIDAD ===' as titulo;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK: Todas las reservas tienen asiento ocupado'
        ELSE 'PROBLEMA: ' || COUNT(*)::TEXT || ' reservas con asiento libre'
    END as integridad_asientos
FROM public.reserva r
JOIN public.asiento a ON r.asiento_id = a.id
WHERE r.estado = 'confirmada' AND a.ocupado = FALSE

UNION ALL

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK: Todos los asientos ocupados tienen reserva'
        ELSE 'PROBLEMA: ' || COUNT(*)::TEXT || ' asientos ocupados sin reserva'
    END
FROM public.asiento a
WHERE a.ocupado = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.reserva r 
    WHERE r.asiento_id = a.id AND r.estado = 'confirmada'
);