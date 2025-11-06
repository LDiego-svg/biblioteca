<?php
include 'db_config.php'; // Incluimos la conexión a la BD

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Usuario y contraseña requeridos.']);
    exit;
}

// 1. Buscamos al usuario SÓLO por el username
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE username = :username");

// 2. ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!
$stmt->bindParam(':username', $username); // Atamos la variable

$stmt->execute(); 

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// 3. Verificamos si el usuario existe Y si la contraseña coincide
if ($user && password_verify($password, $user['password'])) {
    // ¡Contraseña correcta!
    
    // Ocultamos la contraseña por seguridad antes de enviarla
    unset($user['password']); 
    echo json_encode(['user' => $user]);
} else {
    // Usuario no encontrado o contraseña incorrecta
    echo json_encode(['error' => 'Credenciales incorrectas.']);
}
?>