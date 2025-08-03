-- Script para crear un nuevo usuario con código único de 6 dígitos
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Opción 1: Crear usuario con código específico
-- Cambiar el valor de codigo_param por el deseado
DO $$
DECLARE
    codigo_param TEXT := '999999'; -- Cambiar por el código deseado
    usuario_existente INTEGER;
BEGIN
    -- Verificar que el código tenga exactamente 6 dígitos
    IF LENGTH(codigo_param) != 6 OR codigo_param !~ '^[0-9]{6}$' THEN
        RAISE NOTICE 'Error: El código debe tener exactamente 6 dígitos numéricos';
        RETURN;
    END IF;
    
    -- Verificar si el código ya existe
    SELECT COUNT(*) INTO usuario_existente
    FROM public.usuario
    WHERE codigo = codigo_param;
    
    IF usuario_existente > 0 THEN
        RAISE NOTICE 'Error: Ya existe un usuario con el código %', codigo_param;
        RETURN;
    END IF;
    
    -- Crear el usuario
    INSERT INTO public.usuario (codigo, nombres, apellidos, dni, correo, telefono, reservado)
    VALUES (codigo_param, NULL, NULL, NULL, NULL, NULL, FALSE);
    
    RAISE NOTICE 'Usuario creado exitosamente con código: %', codigo_param;
    
END $$;

-- Opción 2: Crear usuario con código aleatorio único
-- Este bloque genera automáticamente un código único
DO $$
DECLARE
    codigo_generado TEXT;
    intentos INTEGER := 0;
    max_intentos INTEGER := 100;
BEGIN
    -- Generar código único
    LOOP
        -- Generar código de 6 dígitos aleatorio
        codigo_generado := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Verificar que no exista ya
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.usuario WHERE codigo = codigo_generado
        );
        
        -- Evitar bucle infinito
        intentos := intentos + 1;
        IF intentos > max_intentos THEN
            RAISE NOTICE 'Error: No se pudo generar un código único después de % intentos', max_intentos;
            RETURN;
        END IF;
    END LOOP;
    
    -- Crear el usuario con código generado
    INSERT INTO public.usuario (codigo, nombres, apellidos, dni, correo, telefono, reservado)
    VALUES (codigo_generado, NULL, NULL, NULL, NULL, NULL, FALSE);
    
    RAISE NOTICE 'Usuario creado exitosamente con código generado: %', codigo_generado;
    
END $$;

-- Opción 3: Crear múltiples usuarios con códigos aleatorios
-- Cambiar cantidad_usuarios por el número deseado
DO $$
DECLARE
    cantidad_usuarios INTEGER := 5; -- Cambiar por la cantidad deseada
    i INTEGER;
    codigo_generado TEXT;
    intentos INTEGER;
    max_intentos INTEGER := 100;
BEGIN
    FOR i IN 1..cantidad_usuarios LOOP
        intentos := 0;
        
        -- Generar código único para cada usuario
        LOOP
            codigo_generado := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
            
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.usuario WHERE codigo = codigo_generado
            );
            
            intentos := intentos + 1;
            IF intentos > max_intentos THEN
                RAISE NOTICE 'Error: No se pudo generar código único para usuario % después de % intentos', i, max_intentos;
                EXIT;
            END IF;
        END LOOP;
        
        -- Crear el usuario si se generó un código único
        IF intentos <= max_intentos THEN
            INSERT INTO public.usuario (codigo, nombres, apellidos, dni, correo, telefono, reservado)
            VALUES (codigo_generado, NULL, NULL, NULL, NULL, NULL, FALSE);
            
            RAISE NOTICE 'Usuario % creado con código: %', i, codigo_generado;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Proceso completado. Se intentaron crear % usuarios', cantidad_usuarios;
    
END $$;

-- Consulta para verificar los usuarios creados
SELECT 
    'Últimos usuarios creados' as info,
    codigo,
    created_at as fecha_creacion,
    reservado as tiene_reserva
FROM public.usuario
ORDER BY created_at DESC
LIMIT 10;

-- Estadísticas de usuarios
SELECT 
    'Total de usuarios' as metrica,
    COUNT(*)::TEXT as valor
FROM public.usuario

UNION ALL

SELECT 
    'Usuarios con reserva',
    COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = TRUE

UNION ALL

SELECT 
    'Usuarios sin reserva',
    COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = FALSE

UNION ALL

SELECT 
    'Usuarios creados hoy',
    COUNT(*)::TEXT
FROM public.usuario
WHERE DATE(created_at) = CURRENT_DATE;