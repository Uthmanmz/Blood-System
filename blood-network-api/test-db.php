<?php

require_once __DIR__ . '/config/database.php';

$database = new Database();
$pdo = $database->connect();

echo "Database connected successfully!";