<?php
// Configuración de la conexión a la base de datos
$servername = "localhost"; // El servidor de XAMPP
$username_db = "root";     // Usuario por defecto de XAMPP
$password_db = "";         // Contraseña por defecto de XAMPP (vacía)
$dbname = "biblioteca_db";   // El nombre de tu base de datos

try {
    // Creamos una conexión PDO (la forma moderna de conectarse a MySQL con PHP)
    $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8", $username_db, $password_db);
    // Configuramos para que reporte errores
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Si la conexión falla, morimos y mostramos el error
    die("Error de conexión: " . $e->getMessage());
}

// Esto es para asegurarnos de que el PHP responda con JSON y permita peticiones
header("Access-Control-Allow-Origin: *"); // Permite cualquier origen (para desarrollo)
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Content-Type: application/json; charset=UTF-8");

// Leemos los datos JSON que nos envía el JavaScript
$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);
?>