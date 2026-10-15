<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';

requireAuth();

$hospitalId = requireHospitalScope();

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
        created_at,
        updated_at
    FROM hospitals
    WHERE id = ?
    LIMIT 1
");

$stmt->execute([$hospitalId]);

$hospital = $stmt->fetch();

if (!$hospital) {
    jsonResponse(
        false,
        'Hospital not found',
        [],
        404
    );
}

jsonResponse(
    true,
    'Hospital retrieved successfully',
    [
        'hospital' => $hospital
    ]
);