<?php
include 'db_config.php'; // Incluimos la conexión a la BD

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Usuario y contraseña requeridos.']);
    exit;
}

// Preparamos la consulta para encontrar al usuario
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE username = :username AND password = :password");
$stmt->bindParam(':username', $username);
$stmt->bindParam(':password', $password);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    // ¡Usuario encontrado! Lo devolvemos como JSON
    // Ocultamos la contraseña por seguridad
    unset($user['password']); 
    echo json_encode(['user' => $user]);
} else {
    // Usuario no encontrado
    echo json_encode(['error' => 'Credenciales incorrectas.']);
}
?>