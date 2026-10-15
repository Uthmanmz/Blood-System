<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['organisation_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, 'Only GET requests are allowed', [], 405);
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.account_status,
        u.last_login_at,
        u.created_at,
        h.id AS hospital_id,
        h.name AS hospital_name,
        h.status AS hospital_status
    FROM users u
    INNER JOIN hospitals h
        ON h.id = u.hospital_id
    WHERE u.role = 'hospital_admin'
    ORDER BY h.name ASC, u.full_name ASC
");

$stmt->execute();

$administrators = $stmt->fetchAll();

jsonResponse(
    true,
    'Hospital administrators retrieved successfully',
    [
        'administrators' => $administrators
    ]
);
