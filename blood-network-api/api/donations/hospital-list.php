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
    requirePermission('RECORD_DONATIONS');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        d.id,
        d.donation_reference,
        d.donation_date,
        d.status,
        d.entry_method,
        d.appointment_id,
        d.notes,
        d.completed_at,
        d.created_at,

        dp.id AS donor_id,
        dp.blood_group,

        u.full_name AS donor_name,
        u.phone AS donor_phone,
        u.email AS donor_email,

        bu.id AS blood_unit_id,
        bu.unit_code,
        bu.status AS blood_unit_status,
        bu.expiry_date

    FROM donations d

    INNER JOIN donor_profiles dp
        ON dp.id = d.donor_id

    INNER JOIN users u
        ON u.id = dp.user_id

    LEFT JOIN blood_units bu
        ON bu.donation_id = d.id

    WHERE d.hospital_id = ?

    ORDER BY d.id DESC
");

$stmt->execute([
    $hospitalId
]);

$donations = $stmt->fetchAll();

jsonResponse(
    true,
    'Hospital donations retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'donations' => $donations
    ]
);