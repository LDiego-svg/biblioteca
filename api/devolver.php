<?php
include 'db_config.php';

$id_prestamo = $data['id_prestamo'] ?? 0;

if (empty($id_prestamo)) {
    echo json_encode(['error' => 'ID de préstamo requerido.']);
    exit;
}

$stmt = $conn->prepare("DELETE FROM prestamos WHERE id = :id_prestamo");
$stmt->bindParam(':id_prestamo', $id_prestamo);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Libro devuelto!']);
} else {
    echo json_encode(['error' => 'No se pudo devolver el libro.']);
}
?>