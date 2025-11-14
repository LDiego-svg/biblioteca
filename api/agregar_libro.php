<?php

include 'db_config.php'; 

// 1. Obtener datos del JSON 
$title = $data['title'] ?? '';
$author = $data['author'] ?? '';
$category = $data['category'] ?? '';
$description = $data['description'] ?? '';

// 2. Validación de entrada 
if (empty($title) || empty($author) || empty($category)) {
    echo json_encode(['error' => 'Título, autor y categoría son requeridos.']);
    exit;
}

// 3. Insertar el nuevo libro
try {
    $stmt_insert = $conn->prepare(
        "INSERT INTO libros (title, author, category, description, publishedYear, pages, rating) 
        VALUES (:title, :author, :category, :description, 2024, 100, 4)" 
    );
    
    $stmt_insert->bindParam(':title', $title);
    $stmt_insert->bindParam(':author', $author);
    $stmt_insert->bindParam(':category', $category);
    $stmt_insert->bindParam(':description', $description);

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