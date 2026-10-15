<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';
require_once __DIR__ . '/../../middleware/permission.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

if ($_SESSION['role'] === 'personnel') {
    requirePermission('MANAGE_DONORS');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}

$data = getJsonInput();

if (
    !isset($data['donor_id']) ||
    !array_key_exists('available_for_donation', $data)
) {
    jsonResponse(
        false,
        'Donor and availability value are required',
        [],
        400
    );
}

$donorId = (int) $data['donor_id'];

$available = filter_var(
    $data['available_for_donation'],
    FILTER_VALIDATE_BOOLEAN,
    FILTER_NULL_ON_FAILURE
);

if ($available === null) {
    jsonResponse(
        false,
        'Invalid availability value',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

$checkStmt = $pdo->prepare("
    SELECT id
    FROM donor_profiles
    WHERE id = ?
      AND registration_hospital_id = ?
    LIMIT 1
");

$checkStmt->execute([
    $donorId,
    $hospitalId
]);

if (!$checkStmt->fetch()) {
    jsonResponse(
        false,
        'Donor not found at your hospital',
        [],
        404
    );
}

$updateStmt = $pdo->prepare("
    UPDATE donor_profiles
    SET available_for_donation = ?
    WHERE id = ?
      AND registration_hospital_id = ?
");

$updateStmt->execute([
    $available ? 1 : 0,
    $donorId,
    $hospitalId
]);

jsonResponse(
    true,
    'Donor availability updated successfully',
    [
        'donor_id' => $donorId,
        'available_for_donation' => $available
    ]
);