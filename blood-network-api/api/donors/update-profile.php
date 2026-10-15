<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['donor']);

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
    'phone',
    'address'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required profile information',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$fullName = trim($data['full_name']);
$phone = trim($data['phone']);
$address = trim($data['address']);

$database = new Database();
$pdo = $database->connect();

try {

    $pdo->beginTransaction();

    $userStmt = $pdo->prepare("
        UPDATE users
        SET
            full_name = ?,
            phone = ?
        WHERE id = ?
          AND role = 'donor'
    ");

    $userStmt->execute([
        $fullName,
        $phone,
        $_SESSION['user_id']
    ]);

    $profileStmt = $pdo->prepare("
        UPDATE donor_profiles
        SET address = ?
        WHERE user_id = ?
    ");

    $profileStmt->execute([
        $address,
        $_SESSION['user_id']
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Donor profile updated successfully',
        [
            'full_name' => $fullName,
            'phone' => $phone,
            'address' => $address
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to update donor profile',
        [],
        500
    );
}