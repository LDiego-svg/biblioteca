<?php
include 'db_config.php';

$id_libro = $data['id_libro'] ?? 0;
$id_usuario = $data['id_usuario'] ?? 0;

if (empty($id_libro) || empty($id_usuario)) {
    echo json_encode(['error' => 'Datos incompletos.']);
    exit;
}

// Verificamos si ya está prestado
$stmt_check = $conn->prepare("SELECT id FROM prestamos WHERE id_libro = :id_libro AND id_usuario = :id_usuario");
$stmt_check->execute([':id_libro' => $id_libro, ':id_usuario' => $id_usuario]);

if ($stmt_check->fetch()) {
    echo json_encode(['error' => 'Ya tienes este libro prestado.']);
    exit;
}

// Insertamos el nuevo préstamo 
$fecha = date('Y-m-d');
$stmt_insert = $conn->prepare("INSERT INTO prestamos (id_usuario, id_libro, fecha_prestamo) VALUES (:id_usuario, :id_libro, :fecha)");
$stmt_insert->execute([':id_usuario' => $id_usuario, ':id_libro' => $id_libro, ':fecha' => $fecha]);

echo json_encode(['success' => true, 'message' => '¡Libro prestado con éxito!']);
?>