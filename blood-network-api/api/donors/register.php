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
    'full_name',
    'email',
    'phone',
    'password',
    'gender',
    'date_of_birth',
    'blood_group',
    'genotype',
    'address',
    'hospital_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required donor information',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$fullName = trim($data['full_name']);
$email = trim($data['email']);
$phone = trim($data['phone']);
$password = $data['password'];

$gender = trim($data['gender']);
$dateOfBirth = trim($data['date_of_birth']);
$bloodGroup = trim($data['blood_group']);
$genotype = trim($data['genotype']);
$address = trim($data['address']);

$hospitalId = (int) $data['hospital_id'];

$availableForDonation =
    isset($data['available_for_donation'])
        ? (bool) $data['available_for_donation']
        : true;


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(
        false,
        'Please enter a valid email address',
        [],
        400
    );
}


if (strlen($password) < 8) {
    jsonResponse(
        false,
        'Password must be at least 8 characters long',
        [],
        400
    );
}


$allowedGenders = [
    'Male',
    'Female'
];

if (!in_array($gender, $allowedGenders, true)) {
    jsonResponse(
        false,
        'Invalid gender selected',
        [],
        400
    );
}


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
        'Invalid blood group selected',
        [],
        400
    );
}


$database = new Database();
$pdo = $database->connect();


$emailCheck = $pdo->prepare("
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
");

$emailCheck->execute([$email]);

if ($emailCheck->fetch()) {
    jsonResponse(
        false,
        'An account with this email already exists',
        [],
        409
    );
}


$hospitalCheck = $pdo->prepare("
    SELECT id, name, status
    FROM hospitals
    WHERE id = ?
    LIMIT 1
");

$hospitalCheck->execute([$hospitalId]);

$hospital = $hospitalCheck->fetch();

if (!$hospital) {
    jsonResponse(
        false,
        'Hospital not found',
        [],
        404
    );
}

if ($hospital['status'] !== 'Approved') {
    jsonResponse(
        false,
        'Donors can only register with an approved hospital',
        [],
        400
    );
}


$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);


try {

    $pdo->beginTransaction();


    $userStmt = $pdo->prepare("
        INSERT INTO users (
            hospital_id,
            full_name,
            email,
            phone,
            password_hash,
            role,
            account_status
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            'donor',
            'Active'
        )
    ");

    $userStmt->execute([
        $hospitalId,
        $fullName,
        $email,
        $phone,
        $passwordHash
    ]);


    $userId = (int) $pdo->lastInsertId();


    $profileStmt = $pdo->prepare("
        INSERT INTO donor_profiles (
            user_id,
            registration_hospital_id,
            gender,
            date_of_birth,
            blood_group,
            genotype,
            address,
            available_for_donation
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    ");

    $profileStmt->execute([
        $userId,
        $hospitalId,
        $gender,
        $dateOfBirth,
        $bloodGroup,
        $genotype,
        $address,
        $availableForDonation ? 1 : 0
    ]);


    $pdo->commit();


    jsonResponse(
        true,
        'Donor registered successfully',
        [
            'user_id' => $userId,
            'hospital_id' => $hospitalId,
            'hospital_name' => $hospital['name']
        ],
        201
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to register donor',
        [],
        500
    );
}