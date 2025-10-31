<?php
include 'db_config.php';

// El ID del usuario viene por la URL (ej. ...?id_usuario=2)
$id_usuario = $_GET['id_usuario'] ?? 0;

if (empty($id_usuario)) {
    echo json_encode(['error' => 'ID de usuario requerido.']);
    exit;
}

$stmt = $conn->prepare("
    SELECT 
        p.id AS id_prestamo, 
        p.id_libro,
        p.fecha_prestamo, -- <-- La columna original
        l.title,
        l.author
    FROM prestamos p
    JOIN libros l ON p.id_libro = l.id
    WHERE p.id_usuario = :id_usuario
");
$stmt->bindParam(':id_usuario', $id_usuario);
$stmt->execute();

$libros_prestados = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($libros_prestados);
?>