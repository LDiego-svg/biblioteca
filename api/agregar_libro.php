<?php

include 'db_config.php'; 

// 1. Obtener datos del JSON 
$title = $data['title'] ?? '';
$author = $data['author'] ?? '';
$category = $data['category'] ?? '';
$description = $data['description'] ?? '';
$imagen_url = $data['imagen_url'] ?? '';
$publishedYear = $data['publishedYear'] ?? '';
$pages = $data['pages'] ?? '';

// 2. Validación de entrada 
if (empty($title) || empty($author) || empty($category)) {
    echo json_encode(['error' => 'Título, autor y categoría son requeridos.']);
    exit;
}

// 3. Insertar el nuevo libro
try {
    $stmt_insert = $conn->prepare(
        "INSERT INTO libros (title, author, category, description, publishedYear, pages, rating, imagen_url) 
        VALUES (:title, :author, :category, :description, :publishedYear, :pages, 4, :imagen_url)" 
    );
    
    $stmt_insert->bindParam(':title', $title);
    $stmt_insert->bindParam(':author', $author);
    $stmt_insert->bindParam(':category', $category);
    $stmt_insert->bindParam(':description', $description);
    $stmt_insert->bindParam(':imagen_url', $imagen_url);
    $stmt_insert->bindParam(':publishedYear', $publishedYear);
    $stmt_insert->bindParam(':pages', $pages);

    // 5. Ejecutar y responder
    if ($stmt_insert->execute()) {
        echo json_encode(['success' => true, 'message' => '¡Libro añadido con éxito!']);
    } else {
        echo json_encode(['error' => 'Error al añadir el libro.']);
    }

} catch (PDOException $e) {
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>