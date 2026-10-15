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
    'personnel_user_id',
    'full_name',
    'email',
    'phone',
    'job_title'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required information',
        ['missing_fields' => $missing],
        400
    );
}

$personnelUserId = (int) $data['personnel_user_id'];
$fullName = trim($data['full_name']);
$email = trim($data['email']);
$phone = trim($data['phone']);
$jobTitle = trim($data['job_title']);

$staffNumber = isset($data['staff_number'])
    ? trim($data['staff_number'])
    : null;

$permissions = isset($data['permissions']) && is_array($data['permissions'])
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
            'Invalid permission supplied',
            [],
            400
        );
    }
}

$permissions = array_values(array_unique($permissions));

$database = new Database();
$pdo = $database->connect();

$personnelCheck = $pdo->prepare("
    SELECT id
    FROM users
    WHERE id = ?
      AND hospital_id = ?
      AND role = 'personnel'
    LIMIT 1
");

$personnelCheck->execute([
    $personnelUserId,
    $hospitalId
]);

if (!$personnelCheck->fetch()) {
    jsonResponse(
        false,
        'Personnel not found in your hospital',
        [],
        404
    );
}

$emailCheck = $pdo->prepare("
    SELECT id
    FROM users
    WHERE email = ?
      AND id != ?
    LIMIT 1
");

$emailCheck->execute([
    $email,
    $personnelUserId
]);

if ($emailCheck->fetch()) {
    jsonResponse(
        false,
        'Another account already uses this email',
        [],
        409
    );
}

try {

    $pdo->beginTransaction();

    $userUpdate = $pdo->prepare("
        UPDATE users
        SET
            full_name = ?,
            email = ?,
            phone = ?
        WHERE id = ?
          AND hospital_id = ?
          AND role = 'personnel'
    ");

    $userUpdate->execute([
        $fullName,
        $email,
        $phone,
        $personnelUserId,
        $hospitalId
    ]);

    $profileUpdate = $pdo->prepare("
        UPDATE personnel_profiles
        SET
            staff_number = ?,
            job_title = ?
        WHERE user_id = ?
    ");

    $profileUpdate->execute([
        $staffNumber ?: null,
        $jobTitle,
        $personnelUserId
    ]);

    $deletePermissions = $pdo->prepare("
        DELETE FROM personnel_permissions
        WHERE personnel_user_id = ?
    ");

    $deletePermissions->execute([
        $personnelUserId
    ]);

    if (!empty($permissions)) {

        $permissionInsert = $pdo->prepare("
            INSERT INTO personnel_permissions (
                personnel_user_id,
                permission
            )
            VALUES (?, ?)
        ");

        foreach ($permissions as $permission) {
            $permissionInsert->execute([
                $personnelUserId,
                $permission
            ]);
        }
    }

    $pdo->commit();

    jsonResponse(
        true,
        'Personnel updated successfully',
        [
            'personnel_user_id' => $personnelUserId,
            'hospital_id' => $hospitalId,
            'permissions' => $permissions
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to update personnel',
        [],
        500
    );
}