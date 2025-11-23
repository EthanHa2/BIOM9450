<?php
$config = require __DIR__ . '/../db_config.php';
$dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];
try {
    $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
    error_log('Success');
} catch (Throwable $e) {
    http_response_code(500);
    exit('Database connection failed.');
}
