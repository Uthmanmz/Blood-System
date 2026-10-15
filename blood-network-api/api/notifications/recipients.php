<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';
require_once __DIR__ . '/../../middleware/permission.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

if ($_SESSION['role'] === 'personnel') {
    requirePermission('SEND_NOTIFICATIONS');
}

$database = new Database();
$pdo = $database->connect();

$donorStmt = $pdo->prepare("
    SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        'donor' AS role,
        dp.blood_group

    FROM donor_profiles dp

    INNER JOIN users u
        ON u.id = dp.user_id

    WHERE dp.registration_hospital_id = ?
      AND u.account_status = 'Active'

    ORDER BY u.full_name ASC
");

$donorStmt->execute([
    $hospitalId
]);

$donors = $donorStmt->fetchAll();


$seekerStmt = $pdo->prepare("
    SELECT DISTINCT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        'seeker' AS role,
        NULL AS blood_group

    FROM seeker_profiles sp

    INNER JOIN users u
        ON u.id = sp.user_id

    INNER JOIN blood_requests br
        ON br.seeker_id = sp.id

    WHERE br.hospital_id = ?
      AND u.account_status = 'Active'

    ORDER BY u.full_name ASC
");

$seekerStmt->execute([
    $hospitalId
]);

$seekers = $seekerStmt->fetchAll();


jsonResponse(
    true,
    'Notification recipients retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'donors' => $donors,
        'seekers' => $seekers
    ]
);