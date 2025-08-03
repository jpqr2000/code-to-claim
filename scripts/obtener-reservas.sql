-- Script para obtener todas las reservas con información completa
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Consulta principal: Todas las reservas activas con información detallada
SELECT 
    r.id as reserva_id,
    r.estado as estado_reserva,
    r.created_at as fecha_reserva,
    
    -- Información de la mesa
    m.numero as mesa_numero,
    m.nombre as mesa_nombre,
    m.capacidad as mesa_capacidad,
    
    -- Información del asiento
    a.numero as asiento_numero,
    a.posicion as asiento_posicion,
    a.ocupado as asiento_ocupado,
    
    -- Información del usuario
    u.codigo as codigo_usuario,
    COALESCE(u.nombres, 'Sin nombre') as nombres_usuario,
    COALESCE(u.apellidos, 'Sin apellido') as apellidos_usuario,
    COALESCE(u.nombres || ' ' || u.apellidos, 'Usuario: ' || u.codigo) as nombre_completo,
    u.dni as dni_usuario,
    u.correo as correo_usuario,
    u.telefono as telefono_usuario

FROM public.reserva r
JOIN public.usuario u ON r.usuario_id = u.id
JOIN public.mesa m ON r.mesa_id = m.id
JOIN public.asiento a ON r.asiento_id = a.id

-- Ordenar por mesa y luego por asiento
ORDER BY m.numero ASC, a.numero ASC;

-- Consulta adicional: Resumen estadístico de reservas
SELECT 
    'Resumen de Reservas' as tipo_info,
    '' as detalle
UNION ALL
SELECT 
    'Total de reservas activas',
    COUNT(*)::TEXT
FROM public.reserva
WHERE estado = 'confirmada'

UNION ALL
SELECT 
    'Total de asientos ocupados',
    COUNT(*)::TEXT
FROM public.asiento
WHERE ocupado = TRUE

UNION ALL
SELECT 
    'Total de usuarios con reserva',
    COUNT(*)::TEXT
FROM public.usuario
WHERE reservado = TRUE

UNION ALL
SELECT 
    'Mesas con reservas',
    COUNT(DISTINCT mesa_id)::TEXT
FROM public.reserva
WHERE estado = 'confirmada'

UNION ALL
SELECT 
    'Porcentaje de ocupación',
    ROUND(
        (COUNT(CASE WHEN ocupado = TRUE THEN 1 END) * 100.0 / COUNT(*)), 2
    )::TEXT || '%'
FROM public.asiento;

-- Consulta por mesas: Ocupación por mesa
SELECT 
    m.numero as mesa_numero,
    m.nombre as mesa_nombre,
    m.capacidad as capacidad_total,
    COUNT(r.id) as asientos_reservados,
    (m.capacidad - COUNT(r.id)) as asientos_libres,
    ROUND((COUNT(r.id) * 100.0 / m.capacidad), 2) as porcentaje_ocupacion

FROM public.mesa m
LEFT JOIN public.reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'

GROUP BY m.id, m.numero, m.nombre, m.capacidad
ORDER BY m.numero;

-- Consulta de mesas completamente llenas
SELECT 
    'Mesas completamente ocupadas:' as info,
    STRING_AGG(m.numero::TEXT || ' (' || m.nombre || ')', ', ') as mesas_llenas

FROM public.mesa m
WHERE (
    SELECT COUNT(*) 
    FROM public.reserva r 
    WHERE r.mesa_id = m.id AND r.estado = 'confirmada'
) = m.capacidad;

-- Consulta de mesas completamente vacías
SELECT 
    'Mesas completamente vacías:' as info,
    STRING_AGG(m.numero::TEXT || ' (' || m.nombre || ')', ', ') as mesas_vacias

FROM public.mesa m
WHERE (
    SELECT COUNT(*) 
    FROM public.reserva r 
    WHERE r.mesa_id = m.id AND r.estado = 'confirmada'
) = 0;