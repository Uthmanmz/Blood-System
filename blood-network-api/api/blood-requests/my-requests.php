<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['seeker']);

$database = new Database();
$pdo = $database->connect();


/*
 * Get the currently logged-in Seeker profile.
 */
$seekerStmt = $pdo->prepare("
    SELECT id
    FROM seeker_profiles
    WHERE user_id = ?
    LIMIT 1
");

$seekerStmt->execute([
    $_SESSION['user_id']
]);

$seeker = $seekerStmt->fetch();

if (!$seeker) {
    jsonResponse(
        false,
        'Seeker profile not found',
        [],
        404
    );
}


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

        br.approved_at,
        br.ready_at,
        br.completed_at,
        br.rejected_at,
        br.cancelled_at,

        br.rejection_reason,
        br.cancellation_reason,

        br.created_at,

        h.id AS hospital_id,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.city AS hospital_city,
        h.state AS hospital_state,
        h.phone AS hospital_phone

    FROM blood_requests br

    INNER JOIN hospitals h
        ON h.id = br.hospital_id

    WHERE br.seeker_id = ?

    ORDER BY br.created_at DESC
");

$stmt->execute([
    $seeker['id']
]);

$requests = $stmt->fetchAll();


jsonResponse(
    true,
    'Seeker blood requests retrieved successfully',
    [
        'requests' => $requests
    ]
);