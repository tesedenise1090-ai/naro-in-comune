<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = "localhost";
$db_name = "civica_db";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '/';

if ($method == 'GET' && $path == '/news') {
    $stmt = $conn->prepare("SELECT * FROM news ORDER BY data_pubblicazione DESC");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
} elseif ($method == 'GET' && $path == '/petizioni') {
    $stmt = $conn->prepare("SELECT p.*, c.nome as categoria_nome FROM petizioni p LEFT JOIN categorie c ON p.categoria_id = c.id ORDER BY data_creazione DESC");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
} elseif ($method == 'GET' && $path == '/monitoraggio') {
    $stmt = $conn->prepare("SELECT * FROM monitoraggio_territorio");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
} elseif ($method == 'GET' && $path == '/utility') {
    $stmt = $conn->prepare("SELECT * FROM utility_links");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
} else {
    echo json_encode(["message" => "Endpoint non trovato"]);
}
?>
