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
    'appointment_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Appointment ID is required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$appointmentId = (int) $data['appointment_id'];

$notes = isset($data['notes'])
    ? trim($data['notes'])
    : null;

$database = new Database();
$pdo = $database->connect();


$appointmentStmt = $pdo->prepare("
    SELECT
        a.id,
        a.hospital_id,
        a.donor_id,
        a.appointment_date,
        a.status,

        d.blood_group,

        u.full_name AS donor_name

    FROM appointments a

    INNER JOIN donor_profiles d
        ON d.id = a.donor_id

    INNER JOIN users u
        ON u.id = d.user_id

    WHERE a.id = ?
      AND a.hospital_id = ?

    LIMIT 1
");

$appointmentStmt->execute([
    $appointmentId,
    $hospitalId
]);

$appointment = $appointmentStmt->fetch();

if (!$appointment) {
    jsonResponse(
        false,
        'Appointment not found in your hospital',
        [],
        404
    );
}

if ($appointment['status'] !== 'Completed') {
    jsonResponse(
        false,
        'The appointment must be completed before recording a donation',
        [],
        400
    );
}


$existingDonation = $pdo->prepare("
    SELECT id
    FROM donations
    WHERE appointment_id = ?
    LIMIT 1
");

$existingDonation->execute([
    $appointmentId
]);

if ($existingDonation->fetch()) {
    jsonResponse(
        false,
        'A donation has already been recorded for this appointment',
        [],
        409
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
            ?,
            ?,
            ?,
            'Completed',
            'Appointment',
            ?,
            ?,
            NOW()
        )
    ");

    $donationStmt->execute([
        $hospitalId,
        $appointment['donor_id'],
        $appointmentId,
        $donationReference,
        $donationDate,
        $_SESSION['user_id'],
        $notes ?: null
    ]);

    $donationId = (int) $pdo->lastInsertId();


    $historyStmt = $pdo->prepare("
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

    $historyStmt->execute([
        $donationId,
        $_SESSION['user_id'],
        'Donation recorded from completed appointment'
    ]);


    $bloodUnitStmt = $pdo->prepare("
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

    $bloodUnitStmt->execute([
        $unitCode,
        $hospitalId,
        $donationId,
        $appointment['donor_id'],
        $appointment['blood_group'],
        $donationDate,
        $expiryDate
    ]);

    $bloodUnitId = (int) $pdo->lastInsertId();


    $bloodHistoryStmt = $pdo->prepare("
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

    $bloodHistoryStmt->execute([
        $bloodUnitId,
        $_SESSION['user_id'],
        'Blood unit created from completed donation'
    ]);


    $pdo->commit();


    jsonResponse(
        true,
        'Donation recorded successfully',
        [
            'donation_id' => $donationId,
            'donation_reference' => $donationReference,

            'donor_id' => (int) $appointment['donor_id'],
            'donor_name' => $appointment['donor_name'],

            'hospital_id' => $hospitalId,

            'blood_unit_id' => $bloodUnitId,
            'unit_code' => $unitCode,
            'blood_group' => $appointment['blood_group'],

            'inventory_status' => 'Awaiting Screening'
        ],
        201
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to record donation',
        [],
        500
    );
}