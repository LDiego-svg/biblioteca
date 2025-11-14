<?php
include 'db_config.php'; 

// 1. Obtener el ID del libro
$id_libro = $data['id_libro'] ?? 0;

// 2. Validación
if (empty($id_libro)) {
    echo json_encode(['error' => 'ID de libro requerido.']);
    exit;
}

// 3. Preparar el eliminar libro
$stmt = $conn->prepare("DELETE FROM libros WHERE id = :id_libro");
$stmt->bindParam(':id_libro', $id_libro);

// 4. Ejecutar y responder
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Libro eliminado!']);
} else {
    echo json_encode(['error' => 'No se pudo eliminar el libro.']);
}
?>