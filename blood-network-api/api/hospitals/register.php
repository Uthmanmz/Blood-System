<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';


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
    SELECT
        id,
        status
    FROM hospitals
    WHERE email = ?
    LIMIT 1
");

$check->execute([
    $email
]);

$existing = $check->fetch();


if ($existing) {
    jsonResponse(
        false,
        'A hospital application with this email already exists',
        [
            'status' => $existing['status']
        ],
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
            'Pending',
            NULL
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


    $hospitalId =
        (int) $pdo->lastInsertId();


    /*
     * Keep a status history record for
     * the initial public application.
     *
     * changed_by is intentionally NULL
     * because no authenticated admin
     * performed this action.
     */
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
            'Pending',
            NULL,
            ?
        )
    ");


    $history->execute([
        $hospitalId,
        'Hospital submitted a public registration application'
    ]);


    $pdo->commit();


    jsonResponse(
        true,
        'Hospital application submitted successfully. The Organisation Admin will review your application.',
        [
            'hospital_id' => $hospitalId,
            'status' => 'Pending'
        ],
        201
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    jsonResponse(
        false,
        'Unable to submit hospital application',
        [],
        500
    );
}