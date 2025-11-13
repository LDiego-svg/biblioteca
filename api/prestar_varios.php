<?php
include 'db_config.php'; 

// 1. Obtener datos del JSON
$id_libros = $data['id_libros'] ?? [];
$id_usuario = $data['id_usuario'] ?? 0;

// 2. Validación
if (empty($id_libros) || empty($id_usuario) || !is_array($id_libros)) {
    echo json_encode(['error' => 'Datos incompletos o inválidos.']);
    exit;
}

// 3. Iniciar Transacción
try {
    $conn->beginTransaction();

    $fecha = date('Y-m-d');
    $libros_prestados = 0;
    $libros_ya_tenidos = 0;

    // 4. Preparar consultas 
    $stmt_check = $conn->prepare("SELECT id FROM prestamos WHERE id_libro = :id_libro AND id_usuario = :id_usuario");
    $stmt_insert = $conn->prepare("INSERT INTO prestamos (id_usuario, id_libro, fecha_prestamo) VALUES (:id_usuario, :id_libro, :fecha)");

    // 5. Procesar cada libro
    foreach ($id_libros as $id_libro) {
        $stmt_check->execute([':id_libro' => $id_libro, ':id_usuario' => $id_usuario]);
        
        if (!$stmt_check->fetch()) {
            $stmt_insert->execute([
                ':id_usuario' => $id_usuario, 
                ':id_libro' => (int)$id_libro, 
                ':fecha' => $fecha
            ]);
            $libros_prestados++;
        } else {
            $libros_ya_tenidos++;
        }
    }

    // 6. Confirmar Transacción
    $conn->commit();

    $message = "¡Préstamo completado! Se añadieron $libros_prestados libros nuevos a tu cuenta.";
    if ($libros_ya_tenidos > 0) {
        $message .= " ($libros_ya_tenidos ya estaban en tu posesión.)";
    }

    echo json_encode(['success' => true, 'message' => $message]);

} catch (Exception $e) {
    // 7. Revertir Transacción
    $conn->rollBack();
    echo json_encode(['error' => 'Error al procesar el préstamo: ' . $e->getMessage()]);
}
?>