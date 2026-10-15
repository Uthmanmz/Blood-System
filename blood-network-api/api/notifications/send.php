<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/notificationDelivery.php';

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
    requirePermission('SEND_NOTIFICATIONS');
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
    'recipient_user_id',
    'subject',
    'message',
    'delivery_channel'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Recipient, subject, message and delivery channel are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$recipientUserId = (int) $data['recipient_user_id'];
$subject = trim($data['subject']);
$message = trim($data['message']);
$deliveryChannel = trim($data['delivery_channel']);

$notificationType =
    isset($data['notification_type'])
        ? trim($data['notification_type'])
        : 'General';

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

$allowedTypes = [
    'Donation Invitation',
    'Appointment Update',
    'Donation Update',
    'Appreciation',
    'Blood Request Update',
    'Seasonal Greeting',
    'General',
    'Personnel Notice'
];

if (!in_array($notificationType, $allowedTypes, true)) {
    jsonResponse(
        false,
        'Invalid notification type',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

/*
 * Recipient must either:
 * 1. Be a donor registered with this hospital, or
 * 2. Be a seeker who has submitted at least one request to this hospital.
 */
$stmt = $pdo->prepare("
    SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.account_status

    FROM users u

    WHERE u.id = ?
      AND u.account_status = 'Active'
      AND (
            EXISTS (
                SELECT 1
                FROM donor_profiles dp
                WHERE dp.user_id = u.id
                  AND dp.registration_hospital_id = ?
            )

            OR

            EXISTS (
                SELECT 1
                FROM seeker_profiles sp

                INNER JOIN blood_requests br
                    ON br.seeker_id = sp.id

                WHERE sp.user_id = u.id
                  AND br.hospital_id = ?
            )
      )

    LIMIT 1
");

$stmt->execute([
    $recipientUserId,
    $hospitalId,
    $hospitalId
]);

$recipient = $stmt->fetch();

if (!$recipient) {
    jsonResponse(
        false,
        'Recipient is not associated with your hospital',
        [],
        403
    );
}

if (
    in_array($deliveryChannel, ['SMS', 'Both'], true)
    && empty($recipient['phone'])
) {
    jsonResponse(
        false,
        'Recipient does not have a phone number',
        [],
        400
    );
}

if (
    in_array($deliveryChannel, ['Email', 'Both'], true)
    && empty($recipient['email'])
) {
    jsonResponse(
        false,
        'Recipient does not have an email address',
        [],
        400
    );
}

$smsStatus =
    in_array($deliveryChannel, ['SMS', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';

$emailStatus =
    in_array($deliveryChannel, ['Email', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';

$insertStmt = $pdo->prepare("
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
        email_status
    )
    VALUES (
        ?,
        ?,
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

$insertStmt->execute([
    $recipientUserId,
    $_SESSION['user_id'],
    $notificationType,
    $subject,
    $message,
    $deliveryChannel,
    $recipient['phone'],
    $recipient['email'],
    $smsStatus,
    $emailStatus
]);

$notificationId = (int) $pdo->lastInsertId();

/*
 * Attempt actual delivery immediately.
 */
$deliveryResult = deliverNotification(
    $pdo,
    $notificationId
);

jsonResponse(
    true,
    'Notification created and delivery processed',
    [
        'notification_id' => $notificationId,
        'recipient_user_id' => $recipientUserId,
        'recipient_name' => $recipient['full_name'],
        'notification_type' => $notificationType,
        'delivery_channel' => $deliveryChannel,

        'sms_status' =>
            $deliveryResult['sms_status'],

        'email_status' =>
            $deliveryResult['email_status'],

        'sms_error' =>
            $deliveryResult['sms_error'],

        'email_error' =>
            $deliveryResult['email_error']
    ],
    201
);