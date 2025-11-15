<?php
include 'db_config.php'; 

//  Obtener datos del JSON
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

//  Validación simple de entrada
if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Usuario y contraseña requeridos.']);
    exit;
}

//  Buscar al usuario por username
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE username = :username");
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

//  Verificación
if ($user && password_verify($password, $user['password'])) {
    
    unset($user['password']); 
    
    echo json_encode(['user' => $user]);

} else {
    echo json_encode(['error' => 'Credenciales incorrectas.']);
}
?>