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
    'status'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Personnel ID and status are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$personnelUserId = (int) $data['personnel_user_id'];
$status = trim($data['status']);

$allowedStatuses = [
    'Active',
    'Disabled'
];

if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse(
        false,
        'Status must be Active or Disabled',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

$check = $pdo->prepare("
    SELECT
        id,
        full_name,
        account_status
    FROM users
    WHERE id = ?
      AND hospital_id = ?
      AND role = 'personnel'
    LIMIT 1
");

$check->execute([
    $personnelUserId,
    $hospitalId
]);

$personnel = $check->fetch();

if (!$personnel) {
    jsonResponse(
        false,
        'Personnel not found in your hospital',
        [],
        404
    );
}

$update = $pdo->prepare("
    UPDATE users
    SET account_status = ?
    WHERE id = ?
      AND hospital_id = ?
      AND role = 'personnel'
");

$update->execute([
    $status,
    $personnelUserId,
    $hospitalId
]);

jsonResponse(
    true,
    'Personnel status updated successfully',
    [
        'personnel_user_id' => $personnelUserId,
        'full_name' => $personnel['full_name'],
        'status' => $status
    ]
);