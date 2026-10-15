<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';


requireAuth();
requireRole(['donor']);


if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(
        false,
        'Only GET requests are allowed',
        [],
        405
    );
}


$database = new Database();
$pdo = $database->connect();


/*
|--------------------------------------------------------------------------
| GET LOGGED-IN DONOR
|--------------------------------------------------------------------------
*/

$donorStmt = $pdo->prepare("
    SELECT
        dp.id AS donor_id,
        dp.blood_group,
        dp.registration_hospital_id,

        u.full_name,

        h.name AS hospital_name

    FROM donor_profiles dp

    INNER JOIN users u
        ON u.id = dp.user_id

    INNER JOIN hospitals h
        ON h.id = dp.registration_hospital_id

    WHERE dp.user_id = ?
      AND u.role = 'donor'

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


$donorId = (int) $donor['donor_id'];


/*
|--------------------------------------------------------------------------
| DONATION HISTORY
|--------------------------------------------------------------------------
*/

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

        a.id AS appointment_id,
        a.appointment_date,
        a.appointment_time,

        h.id AS hospital_id,
        h.name AS hospital_name,

        bu.id AS blood_unit_id,
        bu.unit_code,
        bu.blood_group,
        bu.collection_date,
        bu.expiry_date,
        bu.status AS inventory_status

    FROM donations d

    INNER JOIN hospitals h
        ON h.id = d.hospital_id

    LEFT JOIN appointments a
        ON a.id = d.appointment_id

    LEFT JOIN blood_units bu
        ON bu.donation_id = d.id

    WHERE d.donor_id = ?

    ORDER BY
        d.donation_date DESC,
        d.id DESC
");

$stmt->execute([
    $donorId
]);

$donations = $stmt->fetchAll();


jsonResponse(
    true,
    'Donation history retrieved successfully',
    [
        'donor' => [
            'donor_id' =>
                $donorId,

            'full_name' =>
                $donor['full_name'],

            'blood_group' =>
                $donor['blood_group'],

            'registration_hospital_id' =>
                (int) $donor['registration_hospital_id'],

            'hospital_name' =>
                $donor['hospital_name']
        ],

        'total_donations' =>
            count($donations),

        'donations' =>
            $donations
    ]
);