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
    jsonResponse(false, 'Only POST requests are allowed', [], 405);
}

$data = getJsonInput();

$missing = requiredFields($data, [
    'hospital_id',
    'full_name',
    'email',
    'phone',
    'password'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required Hospital Admin information',
        ['missing_fields' => $missing],
        400
    );
}

$hospitalId = (int) $data['hospital_id'];
$fullName = trim($data['full_name']);
$email = trim($data['email']);
$phone = trim($data['phone']);
$password = $data['password'];

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

$hospitalStmt = $pdo->prepare("
    SELECT id, name, status
    FROM hospitals
    WHERE id = ?
    LIMIT 1
");

$hospitalStmt->execute([$hospitalId]);

$hospital = $hospitalStmt->fetch();

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
        'Hospital Admin can only be assigned to an approved hospital',
        [],
        400
    );
}

$emailStmt = $pdo->prepare("
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
");

$emailStmt->execute([$email]);

if ($emailStmt->fetch()) {
    jsonResponse(
        false,
        'An account with this email already exists',
        [],
        409
    );
}

$adminStmt = $pdo->prepare("
    SELECT id
    FROM users
    WHERE hospital_id = ?
      AND role = 'hospital_admin'
      AND account_status = 'Active'
    LIMIT 1
");

$adminStmt->execute([$hospitalId]);

if ($adminStmt->fetch()) {
    jsonResponse(
        false,
        'This hospital already has an active Hospital Admin',
        [],
        409
    );
}

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

try {

    $stmt = $pdo->prepare("
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
            'hospital_admin',
            'Active'
        )
    ");

    $stmt->execute([
        $hospitalId,
        $fullName,
        $email,
        $phone,
        $passwordHash
    ]);

    $hospitalAdminId = $pdo->lastInsertId();

    jsonResponse(
        true,
        'Hospital Admin created successfully',
        [
            'hospital_admin_id' => (int) $hospitalAdminId,
            'hospital_id' => $hospitalId,
            'hospital_name' => $hospital['name']
        ],
        201
    );

} catch (PDOException $e) {

    jsonResponse(
        false,
        'Unable to create Hospital Admin',
        [],
        500
    );
}