<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/notificationDelivery.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['seeker']);

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
    'hospital_id',
    'patient_name',
    'blood_group',
    'quantity',
    'urgency',
    'delivery_channel'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Please provide all required blood request information',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$hospitalId = (int) $data['hospital_id'];
$patientName = trim($data['patient_name']);
$bloodGroup = trim($data['blood_group']);
$quantity = (int) $data['quantity'];
$urgency = trim($data['urgency']);
$deliveryChannel = trim($data['delivery_channel']);

$additionalInformation =
    isset($data['additional_information'])
        ? trim($data['additional_information'])
        : null;


$allowedBloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
];

if (!in_array($bloodGroup, $allowedBloodGroups, true)) {
    jsonResponse(
        false,
        'Invalid blood group selected',
        [],
        400
    );
}


if ($quantity < 1) {
    jsonResponse(
        false,
        'Quantity must be at least 1 unit',
        [],
        400
    );
}


$allowedUrgencies = [
    'Routine',
    'Urgent'
];

if (!in_array($urgency, $allowedUrgencies, true)) {
    jsonResponse(
        false,
        'Urgency must be Routine or Urgent',
        [],
        400
    );
}


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


$database = new Database();
$pdo = $database->connect();


$seekerStmt = $pdo->prepare("
    SELECT
        s.id AS seeker_id,
        u.full_name,
        u.email,
        u.phone
    FROM seeker_profiles s

    INNER JOIN users u
        ON u.id = s.user_id

    WHERE s.user_id = ?

    LIMIT 1
");

$seekerStmt->execute([
    $_SESSION['user_id']
]);

$seeker = $seekerStmt->fetch();

if (!$seeker) {
    jsonResponse(
        false,
        'Seeker profile not found',
        [],
        404
    );
}


$hospitalStmt = $pdo->prepare("
    SELECT
        id,
        name,
        status
    FROM hospitals
    WHERE id = ?
    LIMIT 1
");

$hospitalStmt->execute([
    $hospitalId
]);

$hospital = $hospitalStmt->fetch();

if (!$hospital) {
    jsonResponse(
        false,
        'Hospital not found',
        [],
        404
    );
}

if ($hospital['status'] !== 'Approved') {
    jsonResponse(
        false,
        'Blood requests can only be sent to an approved hospital',
        [],
        400
    );
}


$trackingNumber =
    'BR-' .
    date('Ymd') .
    '-' .
    strtoupper(bin2hex(random_bytes(3)));


try {

    $pdo->beginTransaction();


        $requestStmt = $pdo->prepare("
    INSERT INTO blood_requests (
        tracking_number,
        seeker_id,
        hospital_id,
        patient_name,
        blood_group,
        quantity,
        urgency,
        additional_information,
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
        ?,
        ?,
        ?,
        'Submitted'
    )
");

$requestStmt->execute([
    $trackingNumber,
    $seeker['seeker_id'],
    $hospitalId,
    $patientName,
    $bloodGroup,
    $quantity,
    $urgency,
    $additionalInformation ?: null,
    $deliveryChannel
]);

    $requestId = (int) $pdo->lastInsertId();


    $historyStmt = $pdo->prepare("
        INSERT INTO request_history (
            blood_request_id,
            old_status,
            new_status,
            changed_by,
            note
        )
        VALUES (
            ?,
            NULL,
            'Submitted',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $requestId,
        $_SESSION['user_id'],
        'Blood request submitted by Seeker'
    ]);


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
            blood_request_id
        )
        VALUES (
            ?,
            NULL,
            'Blood Request Update',
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

    $subject = 'Blood Request Submitted';

    $message =
        'Your blood request has been submitted successfully. ' .
        'Tracking number: ' . $trackingNumber . '.';


    $notificationStmt->execute([
        $_SESSION['user_id'],
        $subject,
        $message,
        $deliveryChannel,
        $seeker['phone'],
        $seeker['email'],
        $smsStatus,
        $emailStatus,
        $requestId
    ]);

    $notificationId = (int) $pdo->lastInsertId();

    $pdo->commit();
    
    $deliveryResult = deliverNotification(
    $pdo,
    $notificationId
    );

    jsonResponse(
        true,
        'Blood request submitted successfully',
        [
            'request_id' => $requestId,
            'tracking_number' => $trackingNumber,
            'hospital_id' => $hospitalId,
            'hospital_name' => $hospital['name'],
            'blood_group' => $bloodGroup,
            'quantity' => $quantity,
            'urgency' => $urgency,
            'status' => 'Submitted',
            'delivery_channel' => $deliveryChannel
        ],
        201
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to submit blood request',
        [],
        500
    );
}