<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';




$bloodGroup = isset($_GET['blood_group'])
    ? trim($_GET['blood_group'])
    : '';

$allowedBloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
];

if (!in_array($bloodGroup, $allowedBloodGroups, true)) {
    jsonResponse(
        false,
        'Please provide a valid blood group',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        h.id AS hospital_id,
        h.name AS hospital_name,
        h.address,
        h.city,
        h.state,
        h.phone,

        COUNT(bu.id) AS available_units

    FROM hospitals h

    LEFT JOIN blood_units bu
        ON bu.hospital_id = h.id
        AND bu.blood_group = ?
        AND bu.status = 'Available'
        AND bu.expiry_date >= CURDATE()

    WHERE h.status = 'Approved'

    GROUP BY
        h.id,
        h.name,
        h.address,
        h.city,
        h.state,
        h.phone

    HAVING available_units > 0

    ORDER BY available_units DESC, h.name ASC
");

$stmt->execute([
    $bloodGroup
]);

$hospitals = $stmt->fetchAll();

jsonResponse(
    true,
    'Blood availability search completed',
    [
        'blood_group' => $bloodGroup,
        'hospitals' => $hospitals
    ]
);