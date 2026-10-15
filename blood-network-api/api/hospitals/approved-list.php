<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->query("
    SELECT
        id,
        name,
        address,
        city,
        state,
        email,
        phone

    FROM hospitals

    WHERE status = 'Approved'

    ORDER BY name ASC
");

$hospitals = $stmt->fetchAll();

jsonResponse(
    true,
    'Approved hospitals retrieved successfully',
    [
        'hospitals' => $hospitals
    ]
);