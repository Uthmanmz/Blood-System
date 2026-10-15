<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';


requireAuth();

requireRole([
    'organisation_admin'
]);


$database = new Database();
$pdo = $database->connect();


$stmt = $pdo->prepare("
    SELECT
        id,
        name,
        address,
        state,
        city,
        email,
        phone,
        contact_name,
        contact_email,
        status,
        rejection_reason,
        suspension_reason,
        reviewed_at,
        suspended_at,
        created_at,
        updated_at
    FROM hospitals
    ORDER BY created_at DESC
");

$stmt->execute();

$hospitals = $stmt->fetchAll();


jsonResponse(
    true,
    'Hospitals retrieved successfully',
    [
        'hospitals' => $hospitals
    ]
);