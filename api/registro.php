<?php
include 'db_config.php'; // Incluimos la conexión a la BD

// Recibimos solo los 4 campos básicos
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$fullName = $data['fullName'] ?? '';
$email = $data['email'] ?? '';

// Validamos solo esos 4 campos
if (empty($username) || empty($password) || empty($fullName) || empty($email)) {
    echo json_encode(['error' => 'Nombre, email, usuario y contraseña son requeridos.']);
    exit;
}

// 1. VERIFICAR SI EL USUARIO YA EXISTE
$stmt_check = $conn->prepare("SELECT id FROM usuarios WHERE username = :username");
$stmt_check->bindParam(':username', $username);
$stmt_check->execute();

if ($stmt_check->fetch()) {
    echo json_encode(['error' => 'El nombre de usuario ya está en uso.']);
    exit;
}

// 2. INSERTAR EL NUEVO USUARIO (versión simple)
// (Recuerda que la tabla `usuarios` igual tiene las columnas de dirección,
// pero como las hicimos opcionales (NULL), no pasa nada si no las mandamos.)
$stmt_insert = $conn->prepare("INSERT INTO usuarios (username, password, fullName, email, role) VALUES (:username, :password, :fullName, :email, 'user')");
$stmt_insert->bindParam(':username', $username);
$stmt_insert->bindParam(':password', $password); 
$stmt_insert->bindParam(':fullName', $fullName);
$stmt_insert->bindParam(':email', $email);

if ($stmt_insert->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Usuario registrado con éxito! Ya puedes iniciar sesión.']);
} else {
    echo json_encode(['error' => 'Error al registrar el usuario.']);
}
?>