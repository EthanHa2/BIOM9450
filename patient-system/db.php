<?php
$config = require __DIR__ . '/../db_config.php';

$servername = $config['host'];
$username = $config['user'];
$password = $config['pass'];
$dbname = $config['db'];

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
