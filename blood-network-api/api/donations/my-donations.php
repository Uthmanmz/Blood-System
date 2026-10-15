<?php

require_once __DIR__ . '/../../config/cors.php';
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
        d.id,
        d.donation_reference,
        d.donation_date,
        d.status,
        d.entry_method,
        d.notes,
        d.completed_at,
        d.created_at,

        h.id AS hospital_id,
        h.name AS hospital_name,

        b.id AS blood_unit_id,
        b.unit_code,
        b.blood_group,
        b.status AS blood_unit_status

    FROM donations d

    INNER JOIN hospitals h
        ON h.id = d.hospital_id

    LEFT JOIN blood_units b
        ON b.donation_id = d.id

    WHERE d.donor_id = ?

    ORDER BY d.donation_date DESC, d.id DESC
");

$stmt->execute([
    $donorId
]);

$donations = $stmt->fetchAll();

jsonResponse(
    true,
    'Donation history retrieved successfully',
    [
        'donations' => $donations
    ]
);