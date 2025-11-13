<?php

include 'db_config.php'; // Carga la conexión $conn

// Selecciona todos los campos de la tabla 'libros'
$stmt = $conn->prepare("SELECT * FROM libros");

// 2. Ejecutar y obtener resultados
$stmt->execute();
$libros = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 3. Devolver resultados como JSON
echo json_encode($libros);
?>