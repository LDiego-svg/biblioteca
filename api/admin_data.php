<?php
include 'db_config.php';

$stmt = $conn->prepare("
    SELECT 
        l.title,
        u.username,
        p.fecha_prestamo
    FROM prestamos p
    JOIN libros l ON p.id_libro = l.id
    JOIN usuarios u ON p.id_usuario = u.id
    ORDER BY p.fecha_prestamo DESC
");
$stmt->execute();

$prestamos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($prestamos);
?>