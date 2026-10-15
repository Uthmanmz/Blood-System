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
    requirePermission('PROCESS_BLOOD_REQUESTS');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        br.id,
        br.tracking_number,
        br.patient_name,
        br.blood_group,
        br.quantity,
        br.urgency,
        br.additional_information,
        br.delivery_channel,
        br.status,
        br.rejection_reason,
        br.cancellation_reason,
        br.approved_at,
        br.ready_at,
        br.completed_at,
        br.rejected_at,
        br.cancelled_at,
        br.created_at,

        sp.id AS seeker_id,

        u.full_name AS seeker_name,
        u.email AS seeker_email,
        u.phone AS seeker_phone

    FROM blood_requests br

    INNER JOIN seeker_profiles sp
        ON sp.id = br.seeker_id

    INNER JOIN users u
        ON u.id = sp.user_id

    WHERE br.hospital_id = ?

    ORDER BY
        CASE
            WHEN br.urgency = 'Urgent' THEN 1
            ELSE 2
        END,
        br.created_at ASC
");

$stmt->execute([
    $hospitalId
]);

$requests = $stmt->fetchAll();

jsonResponse(
    true,
    'Blood requests retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'requests' => $requests
    ]
);