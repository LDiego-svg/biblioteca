<?php

include 'db_config.php'; 

// Selecciona todos los campos de la tabla libros
$stmt = $conn->prepare("SELECT * FROM libros");

//  Ejecutar y obtener resultados
$stmt->execute();
$libros = $stmt->fetchAll(PDO::FETCH_ASSOC);

//  Devolver resultados como JSON
echo json_encode($libros);
?>