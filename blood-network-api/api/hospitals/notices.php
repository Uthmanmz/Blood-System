<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        onot.id,
        onot.title,
        onot.message,
        onot.notice_type,
        onot.created_at,

        onr.is_read,
        onr.read_at

    FROM organisation_notice_recipients onr

    INNER JOIN organisation_notices onot
        ON onot.id = onr.notice_id

    WHERE onr.hospital_id = ?

    ORDER BY onot.created_at DESC
");

$stmt->execute([
    $hospitalId
]);

$notices = $stmt->fetchAll();

jsonResponse(
    true,
    'Organisation notices retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'notices' => $notices
    ]
);