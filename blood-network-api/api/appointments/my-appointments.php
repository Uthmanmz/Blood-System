<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['donor']);

$database = new Database();
$pdo = $database->connect();


$donorStmt = $pdo->prepare("
    SELECT id
    FROM donor_profiles
    WHERE user_id = ?
    LIMIT 1
");

$donorStmt->execute([
    $_SESSION['user_id']
]);

$donor = $donorStmt->fetch();

if (!$donor) {
    jsonResponse(
        false,
        'Donor profile not found',
        [],
        404
    );
}

$donorId = (int) $donor['id'];


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

        h.id AS hospital_id,
        h.name AS hospital_name,
        h.address AS hospital_address,
        h.city AS hospital_city,
        h.state AS hospital_state

    FROM appointments a

    INNER JOIN hospitals h
        ON h.id = a.hospital_id

    WHERE a.donor_id = ?

    ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC
");

$stmt->execute([
    $donorId
]);

$appointments = $stmt->fetchAll();


jsonResponse(
    true,
    'Appointments retrieved successfully',
    [
        'appointments' => $appointments
    ]
);