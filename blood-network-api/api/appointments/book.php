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
    'appointment_date',
    'appointment_time'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Appointment date and time are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$appointmentDate = trim($data['appointment_date']);
$appointmentTime = trim($data['appointment_time']);

$note = isset($data['note'])
    ? trim($data['note'])
    : null;
$deliveryChannel = isset($data['delivery_channel'])
    ? trim($data['delivery_channel'])
    : 'Both';

$allowedChannels = [
    'SMS',
    'Email',
    'Both'
];

if (!in_array($deliveryChannel, $allowedChannels, true)) {
    jsonResponse(
        false,
        'Delivery channel must be SMS, Email or Both',
        [],
        400
    );
}

/*
|--------------------------------------------------------------------------
| VALIDATE DATE
|--------------------------------------------------------------------------
*/

$dateObject = DateTime::createFromFormat(
    'Y-m-d',
    $appointmentDate
);

if (
    !$dateObject ||
    $dateObject->format('Y-m-d') !== $appointmentDate
) {
    jsonResponse(
        false,
        'Invalid appointment date',
        [],
        400
    );
}


/*
|--------------------------------------------------------------------------
| VALIDATE TIME
|--------------------------------------------------------------------------
*/

if (!preg_match('/^\d{2}:\d{2}$/', $appointmentTime)) {
    jsonResponse(
        false,
        'Invalid appointment time',
        [],
        400
    );
}

[$hour, $minute] = array_map(
    'intval',
    explode(':', $appointmentTime)
);

if (
    $hour < 0 ||
    $hour > 23 ||
    $minute < 0 ||
    $minute > 59
) {
    jsonResponse(
        false,
        'Invalid appointment time',
        [],
        400
    );
}


/*
|--------------------------------------------------------------------------
| ALLOWED BOOKING HOURS: 7AM - 10PM
|--------------------------------------------------------------------------
*/

$totalMinutes = ($hour * 60) + $minute;

$openingTime = 7 * 60;
$closingTime = 22 * 60;

if (
    $totalMinutes < $openingTime ||
    $totalMinutes > $closingTime
) {
    jsonResponse(
        false,
        'Appointments can only be booked between 7:00 AM and 10:00 PM',
        [],
        400
    );
}


/*
|--------------------------------------------------------------------------
| APPOINTMENT MUST BE IN THE FUTURE
|--------------------------------------------------------------------------
*/

$appointmentDateTime = DateTime::createFromFormat(
    'Y-m-d H:i',
    $appointmentDate . ' ' . $appointmentTime
);

$now = new DateTime();

if ($appointmentDateTime <= $now) {
    jsonResponse(
        false,
        'Appointment date and time must be in the future',
        [],
        400
    );
}


$database = new Database();
$pdo = $database->connect();


/*
|--------------------------------------------------------------------------
| GET LOGGED-IN DONOR PROFILE
|--------------------------------------------------------------------------
*/

    $donorStmt = $pdo->prepare("
    SELECT
        d.id AS donor_id,
        d.registration_hospital_id,

        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,

        h.name AS hospital_name,
        h.status AS hospital_status

    FROM donor_profiles d

    INNER JOIN users u
        ON u.id = d.user_id

    INNER JOIN hospitals h
        ON h.id = d.registration_hospital_id

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


/*
|--------------------------------------------------------------------------
| HOSPITAL MUST STILL BE APPROVED
|--------------------------------------------------------------------------
*/

if ($donor['hospital_status'] !== 'Approved') {
    jsonResponse(
        false,
        'Your registered hospital is currently unavailable for appointments',
        [],
        403
    );
}

$donorId = (int) $donor['donor_id'];

$hospitalId =
    (int) $donor['registration_hospital_id'];


/*
|--------------------------------------------------------------------------
| PREVENT DUPLICATE ACTIVE APPOINTMENT ON SAME DATE
|--------------------------------------------------------------------------
*/

$duplicateStmt = $pdo->prepare("
    SELECT id
    FROM appointments
    WHERE donor_id = ?
      AND appointment_date = ?
      AND status = 'Scheduled'
    LIMIT 1
");

$duplicateStmt->execute([
    $donorId,
    $appointmentDate
]);

if ($duplicateStmt->fetch()) {
    jsonResponse(
        false,
        'You already have a scheduled appointment on this date',
        [],
        409
    );
}


/*
|--------------------------------------------------------------------------
| CREATE APPOINTMENT
|--------------------------------------------------------------------------
*/

try {

    $stmt = $pdo->prepare("
    INSERT INTO appointments (
        hospital_id,
        donor_id,
        appointment_date,
        appointment_time,
        note,
        delivery_channel,
        status
    )

    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'Scheduled'
    )
");

$stmt->execute([
    $hospitalId,
    $donorId,
    $appointmentDate,
    $appointmentTime,
    $note ?: null,
    $deliveryChannel
]);

    $appointmentId =
        (int) $pdo->lastInsertId();

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
        NULL,
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

$subject = 'Donation Appointment Booked';

$message =
    'Your donation appointment has been booked successfully at ' .
    $donor['hospital_name'] .
    ' for ' .
    $appointmentDate .
    ' at ' .
    $appointmentTime .
    '.';

$notificationStmt->execute([
    $donor['user_id'],
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
        'Appointment booked successfully',
    [
    'appointment_id' => $appointmentId,
    'hospital_id' => $hospitalId,
    'hospital_name' => $donor['hospital_name'],
    'appointment_date' => $appointmentDate,
    'appointment_time' => $appointmentTime,
    'delivery_channel' => $deliveryChannel,
    'status' => 'Scheduled'
    ],
        201
    );


} catch (PDOException $e) {

    jsonResponse(
        false,
        'Unable to book appointment',
        [],
        500
    );
}