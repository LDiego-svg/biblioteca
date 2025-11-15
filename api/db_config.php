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
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
    // 3. Fallo de conexión
    // Si la conexión falla, detenemos todo y enviamos un error JSON.
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500); 
    die(json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]));
}

// --- CONFIGURACIÓN DE HEADERS ---

// Permite peticiones desde cualquier origen 
header("Access-Control-Allow-Origin: *"); 
//  Cabeceras permitidas
header("Access-Control-Allow-Headers: *");
//  Métodos HTTP permitidos
header("Access-Control-Allow-Methods: *");
//  Tipo de contenido
header("Content-Type: application/json; charset=UTF-8");

// --- LECTURA DE INPUT JSON ---

$json_input = file_get_contents('php://input');

$data = json_decode($json_input, true);
?>