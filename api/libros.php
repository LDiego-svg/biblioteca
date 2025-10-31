<?php
include 'db_config.php'; // Incluimos la conexión a la BD

// Preparamos la consulta para obtener todos los libros
$stmt = $conn->prepare("SELECT * FROM libros");
$stmt->execute();

$libros = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($libros); // Devolvemos la lista de libros como JSON
?>