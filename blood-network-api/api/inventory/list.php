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
    requirePermission('MANAGE_INVENTORY');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        b.id,
        b.unit_code,
        b.blood_group,
        b.collection_date,
        b.expiry_date,
        b.status,
        b.released_at,
        b.discarded_at,
        b.discard_reason,
        b.created_at,

        d.donation_reference,

        u.full_name AS donor_name,
        u.phone AS donor_phone

    FROM blood_units b

    INNER JOIN donations d
        ON d.id = b.donation_id

    INNER JOIN donor_profiles dp
        ON dp.id = b.donor_id

    INNER JOIN users u
        ON u.id = dp.user_id

    WHERE b.hospital_id = ?

    ORDER BY b.created_at DESC
");

$stmt->execute([
    $hospitalId
]);

$units = $stmt->fetchAll();

jsonResponse(
    true,
    'Inventory retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'units' => $units
    ]
);