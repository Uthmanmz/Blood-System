<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/notificationDelivery.php';

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

$database = new Database();
$pdo = $database->connect();


$donorStmt = $pdo->prepare("
    SELECT
        d.id,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone

    FROM donor_profiles d

    INNER JOIN users u
        ON u.id = d.user_id

    WHERE d.user_id = ?

    LIMIT 1
");

$donorStmt->execute([
    $_SESSION['user_id']
]);

$donor = $donorStmt->fetch();

if (!$donor) {
    jsonResponse(
        false,
        'Donor profile not found',
        [],
        404
    );
}

$donorId = (int) $donor['id'];


    $appointmentStmt = $pdo->prepare("
    SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.delivery_channel,
        a.status,

        h.name AS hospital_name

    FROM appointments a

    INNER JOIN hospitals h
        ON h.id = a.hospital_id

    WHERE a.id = ?
      AND a.donor_id = ?

    LIMIT 1
");

$appointmentStmt->execute([
    $appointmentId,
    $donorId
]);

$appointment = $appointmentStmt->fetch();

if (!$appointment) {
    jsonResponse(
        false,
        'Appointment not found',
        [],
        404
    );
}

if ($appointment['status'] !== 'Scheduled') {
    jsonResponse(
        false,
        'Only scheduled appointments can be cancelled',
        [],
        400
    );
}


$appointmentDateTime = DateTime::createFromFormat(
    'Y-m-d H:i:s',
    $appointment['appointment_date']
    . ' '
    . $appointment['appointment_time']
);

$now = new DateTime();

if ($appointmentDateTime <= $now) {
    jsonResponse(
        false,
        'Past appointments cannot be cancelled',
        [],
        400
    );
}


$stmt = $pdo->prepare("
    UPDATE appointments
    SET
        status = 'Cancelled',
        cancelled_by = ?,
        cancelled_at = NOW()
    WHERE id = ?
      AND donor_id = ?
      AND status = 'Scheduled'
");

$stmt->execute([
    $_SESSION['user_id'],
    $appointmentId,
    $donorId
]);

$deliveryChannel = $appointment['delivery_channel'];

$smsStatus =
    in_array($deliveryChannel, ['SMS', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';

$emailStatus =
    in_array($deliveryChannel, ['Email', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';


$notificationStmt = $pdo->prepare("
    INSERT INTO notifications (
        recipient_user_id,
        sent_by,
        notification_type,
        subject,
        message,
        delivery_channel,
        phone_number,
        email_address,
        sms_status,
        email_status,
        appointment_id
    )
    VALUES (
        ?,
        ?,
        'Appointment Update',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    )
");

$subject = 'Donation Appointment Cancelled';

$message =
    'Your donation appointment at ' .
    $appointment['hospital_name'] .
    ' scheduled for ' .
    $appointment['appointment_date'] .
    ' at ' .
    $appointment['appointment_time'] .
    ' has been cancelled.';

$notificationStmt->execute([
    $donor['user_id'],
    $_SESSION['user_id'],
    $subject,
    $message,
    $deliveryChannel,
    $donor['phone'],
    $donor['email'],
    $smsStatus,
    $emailStatus,
    $appointmentId
]);

$notificationId =
    (int) $pdo->lastInsertId();

$deliveryResult = deliverNotification(
    $pdo,
    $notificationId
);

jsonResponse(
    true,
    'Appointment cancelled successfully',
    [
        'appointment_id' => $appointmentId,
        'status' => 'Cancelled'
    ]
);