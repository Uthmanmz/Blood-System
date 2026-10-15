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
    requirePermission('MANAGE_APPOINTMENTS');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.note,
        a.status,
        a.cancelled_at,
        a.completed_at,
        a.created_at,

        d.id AS donor_id,
        u.full_name AS donor_name,
        u.phone AS donor_phone,
        u.email AS donor_email,

        d.blood_group,
        d.genotype,
        d.available_for_donation

    FROM appointments a

    INNER JOIN donor_profiles d
        ON d.id = a.donor_id

    INNER JOIN users u
        ON u.id = d.user_id

    WHERE a.hospital_id = ?

    ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC
");

$stmt->execute([
    $hospitalId
]);

$appointments = $stmt->fetchAll();

foreach ($appointments as &$appointment) {
    $appointment['available_for_donation'] =
        (bool) $appointment['available_for_donation'];
}

jsonResponse(
    true,
    'Hospital appointments retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'appointments' => $appointments
    ]
);