-- Script para llenar la base de datos con datos de prueba masivos
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Limpiar datos existentes
TRUNCATE TABLE reserva CASCADE;
TRUNCATE TABLE asiento CASCADE;
TRUNCATE TABLE mesa CASCADE;
TRUNCATE TABLE usuario CASCADE;

-- 2. Insertar 35 mesas, cada una con 10 asientos
DO $$
DECLARE
    i INTEGER;
    mesa_id INTEGER;
    j INTEGER;
BEGIN
    -- Crear 35 mesas
    FOR i IN 1..35 LOOP
        INSERT INTO public.mesa (numero, nombre, capacidad)
        VALUES (i, 'Mesa ' || i, 10)
        RETURNING id INTO mesa_id;
        
        -- Crear 10 asientos para cada mesa
        FOR j IN 1..10 LOOP
            INSERT INTO public.asiento (numero, mesa_id, posicion, ocupado)
            VALUES (j, mesa_id, j, FALSE);
        END LOOP;
    END LOOP;
END $$;

-- 3. Generar 400 códigos únicos de 6 dígitos para usuarios
DO $$
DECLARE
    i INTEGER;
    codigo_generado TEXT;
BEGIN
    FOR i IN 1..400 LOOP
        -- Generar código de 6 dígitos único
        LOOP
            codigo_generado := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
            -- Verificar que no exista ya
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.usuario WHERE codigo = codigo_generado);
        END LOOP;
        
        -- Insertar usuario solo con código
        INSERT INTO public.usuario (codigo, nombres, apellidos, dni, correo, telefono, reservado)
        VALUES (codigo_generado, NULL, NULL, NULL, NULL, NULL, FALSE);
    END LOOP;
END $$;

-- 4. Verificar resultados
SELECT 
    'Mesas creadas' as item, 
    COUNT(*)::TEXT as cantidad 
FROM public.mesa
UNION ALL
SELECT 
    'Asientos creados', 
    COUNT(*)::TEXT 
FROM public.asiento
UNION ALL
SELECT 
    'Usuarios con códigos', 
    COUNT(*)::TEXT 
FROM public.usuario
UNION ALL
SELECT 
    'Total asientos por mesa', 
    '10 asientos'
UNION ALL
SELECT 
    'Códigos de ejemplo', 
    STRING_AGG(codigo, ', ')
FROM (
    SELECT codigo 
    FROM public.usuario 
    ORDER BY codigo 
    LIMIT 5
) sample_codes;