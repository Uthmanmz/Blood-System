<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';


requireAuth();
requireRole(['organisation_admin']);


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}


$data = getJsonInput();

$missing = requiredFields($data, [
    'name',
    'address',
    'state',
    'city',
    'email',
    'phone',
    'contact_name',
    'contact_email'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required hospital information',
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
$email = trim($data['email']);
$phone = trim($data['phone']);
$contactName = trim($data['contact_name']);
$contactEmail = trim($data['contact_email']);


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(
        false,
        'Hospital email address is invalid',
        [],
        400
    );
}

if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(
        false,
        'Contact email address is invalid',
        [],
        400
    );
}


$database = new Database();
$pdo = $database->connect();


$check = $pdo->prepare("
    SELECT id
    FROM hospitals
    WHERE email = ?
    LIMIT 1
");

$check->execute([$email]);

if ($check->fetch()) {
    jsonResponse(
        false,
        'A hospital with this email already exists',
        [],
        409
    );
}


try {

    $pdo->beginTransaction();


    $stmt = $pdo->prepare("
        INSERT INTO hospitals (
            name,
            address,
            state,
            city,
            email,
            phone,
            contact_name,
            contact_email,
            status,
            reviewed_at
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'Approved',
            NOW()
        )
    ");

    $stmt->execute([
        $name,
        $address,
        $state,
        $city,
        $email,
        $phone,
        $contactName,
        $contactEmail
    ]);


    $hospitalId = $pdo->lastInsertId();


    $history = $pdo->prepare("
        INSERT INTO hospital_status_history (
            hospital_id,
            old_status,
            new_status,
            changed_by,
            reason
        )
        VALUES (
            ?,
            NULL,
            'Approved',
            ?,
            ?
        )
    ");

    $history->execute([
        $hospitalId,
        $_SESSION['user_id'],
        'Hospital registered directly by Organisation Admin'
    ]);


    $pdo->commit();


    jsonResponse(
        true,
        'Hospital registered successfully',
        [
            'hospital_id' => (int) $hospitalId
        ],
        201
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to register hospital',
        [],
        500
    );
}