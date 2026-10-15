<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';


requireAuth();
requireRole(['hospital_admin']);

$hospitalId = requireHospitalScope();


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}


$data = getJsonInput();

$required = [
    'name',
    'address',
    'state',
    'city',
    'email',
    'phone',
    'contact_name',
    'contact_email'
];

$missing = requiredFields(
    $data,
    $required
);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Complete all hospital details',
        [
            'missing_fields' => $missing
        ],
        400
    );
}


$name = trim($data['name']);
$address = trim($data['address']);
$state = trim($data['state']);
$city = trim($data['city']);
$email = strtolower(
    trim($data['email'])
);
$phone = trim($data['phone']);
$contactName = trim(
    $data['contact_name']
);
$contactEmail = strtolower(
    trim($data['contact_email'])
);


$database = new Database();
$pdo = $database->connect();


$duplicateStmt = $pdo->prepare("
    SELECT id
    FROM hospitals
    WHERE email = ?
      AND id <> ?
    LIMIT 1
");

$duplicateStmt->execute([
    $email,
    $hospitalId
]);

if ($duplicateStmt->fetch()) {
    jsonResponse(
        false,
        'Another hospital already uses this email address',
        [],
        409
    );
}


$updateStmt = $pdo->prepare("
    UPDATE hospitals

    SET
        name = ?,
        address = ?,
        state = ?,
        city = ?,
        email = ?,
        phone = ?,
        contact_name = ?,
        contact_email = ?,
        updated_at = NOW()

    WHERE id = ?
");


$updateStmt->execute([
    $name,
    $address,
    $state,
    $city,
    $email,
    $phone,
    $contactName,
    $contactEmail,
    $hospitalId
]);


$stmt = $pdo->prepare("
    SELECT
        id,
        name,
        address,
        state,
        city,
        email,
        phone,
        contact_name,
        contact_email,
        status,
        created_at,
        updated_at

    FROM hospitals

    WHERE id = ?

    LIMIT 1
");

$stmt->execute([
    $hospitalId
]);


jsonResponse(
    true,
    'Hospital details updated successfully',
    [
        'hospital' => $stmt->fetch()
    ]
);