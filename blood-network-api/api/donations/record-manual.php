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
requireRole(['personnel']);

$hospitalId = requireHospitalScope();

requirePermission('RECORD_DONATIONS');

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
    'donor_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Donor ID is required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$donorId = (int) $data['donor_id'];

$notes =
    isset($data['notes'])
        ? trim($data['notes'])
        : null;

$database = new Database();
$pdo = $database->connect();


/*
 * The donor must belong to this Personnel's hospital.
 */
$donorStmt = $pdo->prepare("
    SELECT
        dp.id AS donor_id,
        dp.blood_group,
        dp.registration_hospital_id,

        u.full_name,
        u.phone

    FROM donor_profiles dp

    INNER JOIN users u
        ON u.id = dp.user_id

    WHERE dp.id = ?
      AND dp.registration_hospital_id = ?
      AND u.account_status = 'Active'

    LIMIT 1
");

$donorStmt->execute([
    $donorId,
    $hospitalId
]);

$donor = $donorStmt->fetch();

if (!$donor) {
    jsonResponse(
        false,
        'Active donor not found in your hospital',
        [],
        404
    );
}


$donationReference =
    'DON-' .
    date('Ymd') .
    '-' .
    strtoupper(bin2hex(random_bytes(3)));

$unitCode =
    'BU-' .
    date('Ymd') .
    '-' .
    strtoupper(bin2hex(random_bytes(3)));

$donationDate = date('Y-m-d');

/*
 * Temporary project default.
 * Later we can centralise/configure the expiry calculation.
 */
$expiryDate = date(
    'Y-m-d',
    strtotime('+35 days')
);


try {

    $pdo->beginTransaction();


    $donationStmt = $pdo->prepare("
        INSERT INTO donations (
            hospital_id,
            donor_id,
            appointment_id,
            donation_reference,
            donation_date,
            status,
            entry_method,
            recorded_by,
            notes,
            completed_at
        )
        VALUES (
            ?,
            ?,
            NULL,
            ?,
            ?,
            'Completed',
            'Manual',
            ?,
            ?,
            NOW()
        )
    ");

    $donationStmt->execute([
        $hospitalId,
        $donorId,
        $donationReference,
        $donationDate,
        $_SESSION['user_id'],
        $notes ?: null
    ]);

    $donationId = (int) $pdo->lastInsertId();


    $donationHistoryStmt = $pdo->prepare("
        INSERT INTO donation_status_history (
            donation_id,
            old_status,
            new_status,
            changed_by,
            note
        )
        VALUES (
            ?,
            NULL,
            'Completed',
            ?,
            ?
        )
    ");

    $donationHistoryStmt->execute([
        $donationId,
        $_SESSION['user_id'],
        'Manual donation recorded by Personnel'
    ]);


    $unitStmt = $pdo->prepare("
        INSERT INTO blood_units (
            unit_code,
            hospital_id,
            donation_id,
            donor_id,
            blood_group,
            collection_date,
            expiry_date,
            status
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'Awaiting Screening'
        )
    ");

    $unitStmt->execute([
        $unitCode,
        $hospitalId,
        $donationId,
        $donorId,
        $donor['blood_group'],
        $donationDate,
        $expiryDate
    ]);

    $bloodUnitId = (int) $pdo->lastInsertId();


    $unitHistoryStmt = $pdo->prepare("
        INSERT INTO blood_unit_history (
            blood_unit_id,
            old_status,
            new_status,
            changed_by,
            note
        )
        VALUES (
            ?,
            NULL,
            'Awaiting Screening',
            ?,
            ?
        )
    ");

    $unitHistoryStmt->execute([
        $bloodUnitId,
        $_SESSION['user_id'],
        'Blood unit created from manual donation'
    ]);


    $pdo->commit();


    jsonResponse(
        true,
        'Manual donation recorded successfully',
        [
            'donation_id' => $donationId,
            'donation_reference' => $donationReference,
            'donor_id' => $donorId,
            'donor_name' => $donor['full_name'],
            'blood_group' => $donor['blood_group'],
            'blood_unit_id' => $bloodUnitId,
            'unit_code' => $unitCode,
            'unit_status' => 'Awaiting Screening',
            'collection_date' => $donationDate,
            'expiry_date' => $expiryDate
        ],
        201
    );


} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to record manual donation',
        [],
        500
    );
}