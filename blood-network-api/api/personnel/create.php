<?php

require_once __DIR__ . '/../../config/cors.php';
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

$missing = requiredFields($data, [
    'full_name',
    'email',
    'phone',
    'password',
    'job_title'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required personnel information',
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
$jobTitle = trim($data['job_title']);

$staffNumber = isset($data['staff_number'])
    ? trim($data['staff_number'])
    : null;

$permissions = isset($data['permissions'])
    && is_array($data['permissions'])
    ? $data['permissions']
    : [];

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

$allowedPermissions = [
    'MANAGE_DONORS',
    'MANAGE_APPOINTMENTS',
    'RECORD_DONATIONS',
    'MANAGE_INVENTORY',
    'PROCESS_BLOOD_REQUESTS',
    'SEND_NOTIFICATIONS'
];

foreach ($permissions as $permission) {
    if (!in_array($permission, $allowedPermissions, true)) {
        jsonResponse(
            false,
            'Invalid personnel permission supplied',
            [],
            400
        );
    }
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

if (!empty($staffNumber)) {

    $staffCheck = $pdo->prepare("
        SELECT id
        FROM personnel_profiles
        WHERE staff_number = ?
        LIMIT 1
    ");

    $staffCheck->execute([$staffNumber]);

    if ($staffCheck->fetch()) {
        jsonResponse(
            false,
            'This staff number already exists',
            [],
            409
        );
    }
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
            'personnel',
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

    $personnelUserId = (int) $pdo->lastInsertId();

    $profileStmt = $pdo->prepare("
        INSERT INTO personnel_profiles (
            user_id,
            staff_number,
            job_title
        )
        VALUES (?, ?, ?)
    ");

    $profileStmt->execute([
        $personnelUserId,
        $staffNumber ?: null,
        $jobTitle
    ]);

    if (!empty($permissions)) {

        $permissionStmt = $pdo->prepare("
            INSERT INTO personnel_permissions (
                personnel_user_id,
                permission
            )
            VALUES (?, ?)
        ");

        foreach ($permissions as $permission) {
            $permissionStmt->execute([
                $personnelUserId,
                $permission
            ]);
        }
    }

    $pdo->commit();

    jsonResponse(
        true,
        'Personnel created successfully',
        [
            'personnel_user_id' => $personnelUserId,
            'hospital_id' => $hospitalId,
            'permissions' => $permissions
        ],
        201
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to create personnel',
        [],
        500
    );
}