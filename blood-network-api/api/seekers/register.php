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
    'password'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required seeker information',
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

$address = isset($data['address'])
    ? trim($data['address'])
    : null;

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
            NULL,
            ?,
            ?,
            ?,
            ?,
            'seeker',
            'Active'
        )
    ");

    $userStmt->execute([
        $fullName,
        $email,
        $phone,
        $passwordHash
    ]);

    $userId = (int) $pdo->lastInsertId();

    $profileStmt = $pdo->prepare("
        INSERT INTO seeker_profiles (
            user_id,
            address
        )
        VALUES (?, ?)
    ");

    $profileStmt->execute([
        $userId,
        $address ?: null
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Seeker registered successfully',
        [
            'user_id' => $userId
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to register seeker',
        [],
        500
    );
}