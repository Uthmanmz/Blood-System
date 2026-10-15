<?php

require_once __DIR__ . '/../../config/cors.php';
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
    requirePermission('MANAGE_DONORS');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        u.id AS user_id,
        dp.id AS donor_id,
        u.full_name,
        u.email,
        u.phone,
        u.account_status,

        dp.gender,
        dp.date_of_birth,
        dp.blood_group,
        dp.genotype,
        dp.address,
        dp.available_for_donation,
        dp.created_at

    FROM donor_profiles dp

    INNER JOIN users u
        ON u.id = dp.user_id

    WHERE dp.registration_hospital_id = ?

    ORDER BY u.full_name ASC
");

$stmt->execute([
    $hospitalId
]);

$donors = $stmt->fetchAll();

jsonResponse(
    true,
    'Hospital donors retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'donors' => $donors
    ]
);