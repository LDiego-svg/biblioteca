<?php
// --- CONFIGURACIÓN DE BASE DE DATOS ---
$servername = "localhost";
$username_db = "root";
$password_db = "";
$dbname = "biblioteca_db";
$charset = "utf8";

// --- CONEXIÓN PDO ---
try {
    // 1. Crear la conexión PDO
    $dsn = "mysql:host=$servername;dbname=$dbname;charset=$charset";
    $conn = new PDO($dsn, $username_db, $password_db);
    
    // 2. Configurar atributos de PDO
    // Reportar todos los errores de SQL
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
    // 3. Fallo de conexión
    // Si la conexión falla, detenemos todo y enviamos un error JSON.
    // Esto es crucial para que el frontend (apiCall) pueda interpretar el error.
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); // Internal Server Error
    die(json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]));
}

// --- CONFIGURACIÓN DE CABECERAS (HEADERS) ---

// 1. Configuración de CORS (Cross-Origin Resource Sharing)
// Permite peticiones desde cualquier origen (ej. 'localhost:3000')
// NOTA: Para producción, '*' es inseguro. Deberías cambiarlo por tu dominio real.
header("Access-Control-Allow-Origin: *"); 
// 2. Cabeceras permitidas
header("Access-Control-Allow-Headers: *");
// 3. Métodos HTTP permitidos
header("Access-Control-Allow-Methods: *");
// 4. Tipo de contenido
header("Content-Type: application/json; charset=UTF-8");

// --- LECTURA DE INPUT JSON ---

// Lee el 'body' de la petición (ej. desde un POST de JavaScript)
$json_input = file_get_contents('php://input');

// Decodifica el JSON en un array asociativo de PHP (ej. $data['username'])
$data = json_decode($json_input, true);
?>