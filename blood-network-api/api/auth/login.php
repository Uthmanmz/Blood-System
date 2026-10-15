<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
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
    'email',
    'password'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Email and password are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$email = trim($data['email']);
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(
        false,
        'Please enter a valid email address',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        id,
        hospital_id,
        full_name,
        email,
        phone,
        password_hash,
        role,
        account_status
    FROM users
    WHERE email = ?
    LIMIT 1
");

$stmt->execute([$email]);

$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(
        false,
        'Invalid email or password',
        [],
        401
    );
}

if ($user['account_status'] !== 'Active') {
    jsonResponse(
        false,
        'This account is not active',
        [],
        403
    );
}

session_regenerate_id(true);

$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['hospital_id'] = $user['hospital_id'];

$update = $pdo->prepare("
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = ?
");

$update->execute([$user['id']]);

jsonResponse(
    true,
    'Login successful',
    [
        'user' => [
            'id' => $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'hospital_id' => $user['hospital_id']
        ]
    ]
);