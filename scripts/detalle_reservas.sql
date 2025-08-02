-- Script SQL para obtener el detalle completo de las reservas realizadas
-- Incluye información de usuario, mesa, asiento y reserva con todos los campos relevantes

SELECT 
    -- Información de la reserva
    r.id as reserva_id,
    r.estado as reserva_estado,
    r.created_at as fecha_reserva,
    
    -- Información del usuario
    u.id as usuario_id,
    u.nombres as usuario_nombres,
    u.apellidos as usuario_apellidos,
    u.dni as usuario_dni,
    u.correo as usuario_correo,
    u.telefono as usuario_telefono,
    u.codigo as codigo_acceso,
    u.reservado as usuario_tiene_reserva,
    u.created_at as fecha_registro_usuario,
    
    -- Información de la mesa
    m.id as mesa_id,
    m.numero as mesa_numero,
    m.nombre as mesa_nombre,
    m.capacidad as mesa_capacidad,
    
    -- Información del asiento
    a.id as asiento_id,
    a.numero as asiento_numero,
    a.posicion as asiento_posicion,
    a.ocupado as asiento_ocupado,
    
    -- Campos calculados útiles
    CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo,
    CONCAT(m.nombre, ' - Asiento #', a.numero) as ubicacion_completa,
    
    -- Tiempo transcurrido desde la reserva
    EXTRACT(EPOCH FROM (NOW() - r.created_at))/3600 as horas_desde_reserva,
    
    -- Estado de verificación
    CASE 
        WHEN u.reservado = true AND r.estado = 'confirmada' THEN 'Válida'
        WHEN u.reservado = false AND r.estado = 'confirmada' THEN 'Inconsistente - Usuario no marcado como reservado'
        WHEN a.ocupado = false AND r.estado = 'confirmada' THEN 'Inconsistente - Asiento no marcado como ocupado'
        ELSE 'Revisar'
    END as estado_verificacion

FROM reserva r
    INNER JOIN usuario u ON r.usuario_id = u.id
    INNER JOIN mesa m ON r.mesa_id = m.id
    INNER JOIN asiento a ON r.asiento_id = a.id

-- Ordenar por fecha de reserva más reciente primero
ORDER BY r.created_at DESC;


-- ========================================
-- CONSULTAS ADICIONALES ÚTILES
-- ========================================

-- 1. Resumen por mesa
-- SELECT 
--     m.nombre as mesa,
--     m.capacidad as capacidad_total,
--     COUNT(r.id) as reservas_realizadas,
--     (m.capacidad - COUNT(r.id)) as asientos_disponibles,
--     ROUND((COUNT(r.id) * 100.0 / m.capacidad), 2) as porcentaje_ocupacion
-- FROM mesa m
--     LEFT JOIN reserva r ON m.id = r.mesa_id AND r.estado = 'confirmada'
-- GROUP BY m.id, m.nombre, m.capacidad
-- ORDER BY porcentaje_ocupacion DESC;

-- 2. Reservas por día
-- SELECT 
--     DATE(r.created_at) as fecha,
--     COUNT(*) as total_reservas,
--     COUNT(DISTINCT r.usuario_id) as usuarios_unicos,
--     COUNT(DISTINCT r.mesa_id) as mesas_ocupadas
-- FROM reserva r
-- WHERE r.estado = 'confirmada'
-- GROUP BY DATE(r.created_at)
-- ORDER BY fecha DESC;

-- 3. Usuarios con códigos pero sin reserva
-- SELECT 
--     u.codigo,
--     u.nombres,
--     u.apellidos,
--     u.correo,
--     u.created_at as fecha_registro
-- FROM usuario u
--     LEFT JOIN reserva r ON u.id = r.usuario_id
-- WHERE r.id IS NULL
-- ORDER BY u.created_at DESC;

-- 4. Detalle de asientos ocupados vs disponibles por mesa
-- SELECT 
--     m.nombre as mesa,
--     a.numero as asiento,
--     a.ocupado as marcado_ocupado,
--     CASE 
--         WHEN r.id IS NOT NULL THEN CONCAT(u.nombres, ' ', u.apellidos)
--         ELSE 'Disponible'
--     END as ocupado_por,
--     r.created_at as fecha_reserva
-- FROM mesa m
--     INNER JOIN asiento a ON m.id = a.mesa_id
--     LEFT JOIN reserva r ON a.id = r.asiento_id AND r.estado = 'confirmada'
--     LEFT JOIN usuario u ON r.usuario_id = u.id
-- ORDER BY m.numero, a.numero;