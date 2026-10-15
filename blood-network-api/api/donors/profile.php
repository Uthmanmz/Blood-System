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

$stmt = $pdo->prepare("
    SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.account_status,

        d.id AS donor_id,
        d.gender,
        d.date_of_birth,
        d.blood_group,
        d.genotype,
        d.address,
        d.available_for_donation,
        d.registration_hospital_id,

        h.name AS hospital_name,
        h.address AS hospital_address,
        h.city AS hospital_city,
        h.state AS hospital_state,
        h.status AS hospital_status

    FROM users u

    INNER JOIN donor_profiles d
        ON d.user_id = u.id

    INNER JOIN hospitals h
        ON h.id = d.registration_hospital_id

    WHERE u.id = ?
      AND u.role = 'donor'

    LIMIT 1
");

$stmt->execute([
    $_SESSION['user_id']
]);

$donor = $stmt->fetch();

if (!$donor) {
    jsonResponse(
        false,
        'Donor profile not found',
        [],
        404
    );
}

$donor['available_for_donation'] =
    (bool) $donor['available_for_donation'];

jsonResponse(
    true,
    'Donor profile retrieved successfully',
    [
        'donor' => $donor
    ]
);