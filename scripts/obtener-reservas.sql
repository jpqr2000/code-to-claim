-- Script para obtener todas las reservas con información completa
-- Ejecutar en Supabase Dashboard > SQL Editor
-- TODAS LAS SECCIONES EN UNA SOLA CONSULTA

-- ===============================================
-- REPORTE COMPLETO DE RESERVAS
-- ===============================================

SELECT 
    '=== REPORTE COMPLETO DE RESERVAS ===' as seccion,
    '' as info,
    '' as detalle,
    0 as orden
    
UNION ALL

-- SECCIÓN 1: RESUMEN ESTADÍSTICO
SELECT 
    '1. RESUMEN ESTADÍSTICO' as seccion,
    'Total de reservas activas' as info,
    COUNT(*)::TEXT as detalle,
    1 as orden
FROM public.reserva
WHERE estado = 'confirmada'

UNION ALL

SELECT 
    '1. RESUMEN ESTADÍSTICO',
    'Total de asientos ocupados',
    COUNT(*)::TEXT,
    1
FROM public.asiento
WHERE ocupado = TRUE

UNION ALL

SELECT 
    '1. RESUMEN ESTADÍSTICO',
    'Total de usuarios con reserva',
    COUNT(*)::TEXT,
    1
FROM public.usuario
WHERE reservado = TRUE

UNION ALL

SELECT 
    '1. RESUMEN ESTADÍSTICO',
    'Porcentaje de ocupación total',
    ROUND(
        (COUNT(CASE WHEN ocupado = TRUE THEN 1 END) * 100.0 / COUNT(*)), 2
    )::TEXT || '%',
    1
FROM public.asiento

UNION ALL

-- SECCIÓN 2: PRIMERAS 20 RESERVAS
SELECT 
    '2. PRIMERAS 20 RESERVAS' as seccion,
    ('Reserva #' || r.id || ' - Mesa ' || m.numero || ', Asiento ' || a.numero) as info,
    (u.nombres || ' ' || u.apellidos || ' (' || u.codigo || ')') as detalle,
    (2000 + r.id) as orden
FROM (
    SELECT r.*, ROW_NUMBER() OVER (ORDER BY r.id) as rn
    FROM public.reserva r
    WHERE r.estado = 'confirmada'
) r
JOIN public.usuario u ON r.usuario_id = u.id
JOIN public.mesa m ON r.mesa_id = m.id
JOIN public.asiento a ON r.asiento_id = a.id
WHERE r.rn <= 20

UNION ALL

-- SECCIÓN 3: OCUPACIÓN POR MESA (TOP 15)
SELECT 
    '3. TOP 15 MESAS MÁS OCUPADAS' as seccion,
    ('Mesa ' || m.numero || ' (' || m.nombre || ')') as info,
    (COUNT(r.id)::TEXT || ' de ' || m.capacidad::TEXT || ' asientos - ' || 
     ROUND((COUNT(r.id) * 100.0 / m.capacidad), 1) || '%') as detalle,
    (3000 + ROW_NUMBER() OVER ()) as orden
FROM (
    SELECT m.*, COUNT(r.id) as reservas_count
    FROM public.mesa m
    LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
    GROUP BY m.id, m.numero, m.nombre, m.capacidad
    HAVING COUNT(r.id) > 0
    ORDER BY COUNT(r.id) DESC, m.numero
    LIMIT 15
) ranked
JOIN public.mesa m ON ranked.id = m.id
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
GROUP BY m.id, m.numero, m.nombre, m.capacidad

UNION ALL

-- SECCIÓN 4: DISTRIBUCIÓN POR SECTORES
SELECT 
    '4. DISTRIBUCIÓN POR SECTORES' as seccion,
    'Mesas 1-10 (Primer sector)' as info,
    COUNT(r.id)::TEXT || ' reservas' as detalle,
    4 as orden
FROM public.mesa m
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
WHERE m.numero BETWEEN 1 AND 10

UNION ALL

SELECT 
    '4. DISTRIBUCIÓN POR SECTORES',
    'Mesas 11-20 (Segundo sector)',
    COUNT(r.id)::TEXT || ' reservas',
    4
FROM public.mesa m
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
WHERE m.numero BETWEEN 11 AND 20

UNION ALL

SELECT 
    '4. DISTRIBUCIÓN POR SECTORES',
    'Mesas 21-28 (Tercer sector)',
    COUNT(r.id)::TEXT || ' reservas',
    4
FROM public.mesa m
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
WHERE m.numero BETWEEN 21 AND 28

UNION ALL

SELECT 
    '4. DISTRIBUCIÓN POR SECTORES',
    'Mesas 29+ (Segundo piso/Extra)',
    COUNT(r.id)::TEXT || ' reservas',
    4
FROM public.mesa m
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
WHERE m.numero >= 29

UNION ALL

-- SECCIÓN 5: MESAS COMPLETAMENTE LLENAS
SELECT 
    '5. MESAS COMPLETAMENTE LLENAS' as seccion,
    CASE 
        WHEN COUNT(*) = 0 THEN 'No hay mesas completamente llenas'
        ELSE 'Mesa ' || MIN(m.numero)::TEXT || ' (' || MIN(m.nombre) || ')'
    END as info,
    CASE 
        WHEN COUNT(*) = 0 THEN ''
        ELSE COUNT(*)::TEXT || ' mesa(s) al 100%'
    END as detalle,
    5 as orden
FROM public.mesa m
WHERE (
    SELECT COUNT(*) 
    FROM public.reserva r 
    WHERE r.mesa_id = m.id AND r.estado = 'confirmada'
) = m.capacidad

UNION ALL

-- SECCIÓN 6: MESAS COMPLETAMENTE VACÍAS  
SELECT 
    '6. MESAS COMPLETAMENTE VACÍAS' as seccion,
    CASE 
        WHEN COUNT(*) = 0 THEN 'No hay mesas completamente vacías'
        ELSE COUNT(*)::TEXT || ' mesas sin reservas'
    END as info,
    CASE 
        WHEN COUNT(*) = 0 THEN ''
        ELSE 'Mesas: ' || STRING_AGG(m.numero::TEXT, ', ')
    END as detalle,
    6 as orden
FROM public.mesa m
WHERE (
    SELECT COUNT(*) 
    FROM public.reserva r 
    WHERE r.mesa_id = m.id AND r.estado = 'confirmada'
) = 0

UNION ALL

-- SECCIÓN 7: VERIFICACIÓN DE INTEGRIDAD
SELECT 
    '7. VERIFICACIÓN DE INTEGRIDAD' as seccion,
    'Reservas con asientos libres (ERROR)' as info,
    COUNT(*)::TEXT as detalle,
    7 as orden
FROM public.reserva r
JOIN public.asiento a ON r.asiento_id = a.id
WHERE r.estado = 'confirmada' AND a.ocupado = FALSE

UNION ALL

SELECT 
    '7. VERIFICACIÓN DE INTEGRIDAD',
    'Asientos ocupados sin reserva (ERROR)',
    COUNT(*)::TEXT,
    7
FROM public.asiento a
WHERE a.ocupado = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.reserva r 
    WHERE r.asiento_id = a.id AND r.estado = 'confirmada'
)

UNION ALL

SELECT 
    '7. VERIFICACIÓN DE INTEGRIDAD',
    'Usuarios reservados sin reserva (ERROR)',
    COUNT(*)::TEXT,
    7
FROM public.usuario u
WHERE u.reservado = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.reserva r 
    WHERE r.usuario_id = u.id AND r.estado = 'confirmada'
)

UNION ALL

SELECT 
    '7. VERIFICACIÓN DE INTEGRIDAD',
    'Usuarios con datos incompletos',
    COUNT(*)::TEXT,
    7
FROM public.usuario u
WHERE u.reservado = TRUE 
AND (u.nombres IS NULL OR u.apellidos IS NULL OR u.dni IS NULL)

-- Ordenar por sección
ORDER BY orden, seccion, info;