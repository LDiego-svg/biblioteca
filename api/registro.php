<?php
include 'db_config.php'; // Incluimos la conexión a la BD

// Recibimos los 4 campos
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';

// Validamos los 4 campos
if (empty($username) || empty($password) || empty($fullName) || empty($email)) {
    echo json_encode(['error' => 'Nombre, email, usuario y contraseña son requeridos.']);
    exit;
}

// 1. VERIFICAR SI EL USUARIO O EMAIL YA EXISTEN
$stmt_check = $conn->prepare("SELECT id FROM usuarios WHERE username = :username OR email = :email");
$stmt_check->bindParam(':username', $username);
$stmt_check->bindParam(':email', $email); 
$stmt_check->execute();

if ($stmt_check->fetch()) {
    echo json_encode(['error' => 'El nombre de usuario o el email ya están en uso.']);
    exit;
}

// 2. ¡SEGURIDAD! Hasheamos la contraseña
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// 3. INSERTAR EL NUEVO USUARIO
try {
    $stmt_insert = $conn->prepare("INSERT INTO usuarios (username, password, fullName, email, role) VALUES (:username, :password, :fullName, :email, 'user')");
    
    $stmt_insert->bindParam(':username', $username);
    $stmt_insert->bindParam(':password', $hashed_password); // <-- Guardamos el hash
    $stmt_insert->bindParam(':fullName', $fullName);
    $stmt_insert->bindParam(':email', $email);

    if ($stmt_insert->execute()) {
        echo json_encode(['success' => true, 'message' => '¡Usuario registrado con éxito! Ya puedes iniciar sesión.']);
    } else {
        echo json_encode(['error' => 'Error al registrar el usuario.']);
    }

} catch (PDOException $e) {
    // Si la base de datos falla (ej. una columna no existe), esto nos lo dirá.
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
}
?>