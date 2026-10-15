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

$missing = requiredFields($data, [
    'donor_id',
    'full_name',
    'email',
    'phone',
    'gender',
    'date_of_birth',
    'address'
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

$donorId = (int) $data['donor_id'];

$fullName = trim($data['full_name']);
$email = strtolower(trim($data['email']));
$phone = trim($data['phone']);
$gender = trim($data['gender']);
$dateOfBirth = trim($data['date_of_birth']);
$address = trim($data['address']);

if (!in_array($gender, ['Male', 'Female'], true)) {
    jsonResponse(
        false,
        'Invalid gender value',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

try {

    $pdo->beginTransaction();

    /*
     * Confirm that this donor actually belongs
     * to the authenticated hospital.
     */
    $donorStmt = $pdo->prepare("
        SELECT
            dp.id,
            dp.user_id
        FROM donor_profiles dp
        WHERE dp.id = ?
          AND dp.registration_hospital_id = ?
        LIMIT 1
    ");

    $donorStmt->execute([
        $donorId,
        $hospitalId
    ]);

    $donor = $donorStmt->fetch();

    if (!$donor) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Donor not found at your hospital',
            [],
            404
        );
    }

    /*
     * Prevent duplicate email accounts.
     */
    $duplicateStmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = ?
          AND id <> ?
        LIMIT 1
    ");

    $duplicateStmt->execute([
        $email,
        $donor['user_id']
    ]);

    if ($duplicateStmt->fetch()) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Another account already uses this email address',
            [],
            409
        );
    }

    $userStmt = $pdo->prepare("
        UPDATE users
        SET
            full_name = ?,
            email = ?,
            phone = ?
        WHERE id = ?
          AND role = 'donor'
    ");

    $userStmt->execute([
        $fullName,
        $email,
        $phone,
        $donor['user_id']
    ]);

    $profileStmt = $pdo->prepare("
        UPDATE donor_profiles
        SET
            gender = ?,
            date_of_birth = ?,
            address = ?
        WHERE id = ?
          AND registration_hospital_id = ?
    ");

    $profileStmt->execute([
        $gender,
        $dateOfBirth,
        $address,
        $donorId,
        $hospitalId
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Donor profile updated successfully',
        [
            'donor_id' => $donorId,
            'full_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'gender' => $gender,
            'date_of_birth' => $dateOfBirth,
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