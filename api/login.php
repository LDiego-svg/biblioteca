<?php
include 'db_config.php'; // Carga la conexión $conn y los datos $data

// 1. Obtener datos del JSON
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// 2. Validación simple de entrada
if (empty($username) || empty($password)) {
    echo json_encode(['error' => 'Usuario y contraseña requeridos.']);
    exit;
}

// 3. Buscar al usuario por 'username'
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE username = :username");
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// 4. Verificación
// Primero, comprobamos si 'fetch' devolvió un usuario.
// Segundo, usamos password_verify para comparar el hash guardado con el password enviado.
if ($user && password_verify($password, $user['password'])) {
    
    // ¡Éxito!
    
    // Por seguridad, NUNCA devuelvas el hash de la contraseña al frontend.
    unset($user['password']); 
    
    echo json_encode(['user' => $user]);

} else {
    // Error
    // Usamos un mensaje genérico para no dar pistas (ej. no decir "el usuario no existe")
    echo json_encode(['error' => 'Credenciales incorrectas.']);
}
?>