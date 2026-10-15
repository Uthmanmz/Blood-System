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
    requirePermission('MANAGE_DONORS');
}

$donorId = isset($_GET['donor_id'])
    ? (int) $_GET['donor_id']
    : 0;

if ($donorId <= 0) {
    jsonResponse(
        false,
        'Valid donor ID is required',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

/*
 * First confirm that the donor belongs
 * to this authenticated hospital.
 */
$donorStmt = $pdo->prepare("
    SELECT
        dp.id AS donor_id,
        u.full_name,
        dp.blood_group
    FROM donor_profiles dp

    INNER JOIN users u
        ON u.id = dp.user_id

    WHERE dp.id = ?
      AND dp.registration_hospital_id = ?

    LIMIT 1
");

$donorStmt->execute([
    $donorId,
    $hospitalId
]);

$donor = $donorStmt->fetch();

if (!$donor) {
    jsonResponse(
        false,
        'Donor not found at your hospital',
        [],
        404
    );
}

/*
 * SELECT d.* avoids assuming unnecessary frontend
 * fields and returns the real donation record.
 */
$historyStmt = $pdo->prepare("
    SELECT d.*
    FROM donations d

    WHERE d.hospital_id = ?
      AND d.donor_id = ?

    ORDER BY d.id DESC
");

$historyStmt->execute([
    $hospitalId,
    $donorId
]);

$donations = $historyStmt->fetchAll();

jsonResponse(
    true,
    'Donor donation history retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'donor' => $donor,
        'total_donations' => count($donations),
        'donations' => $donations
    ]
);