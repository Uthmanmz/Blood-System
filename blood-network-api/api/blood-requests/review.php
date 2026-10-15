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
    'personnel'
]);

$hospitalId = requireHospitalScope();

requirePermission('PROCESS_BLOOD_REQUESTS');

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
    'request_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Request ID is required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$requestId = (int) $data['request_id'];

$database = new Database();
$pdo = $database->connect();


$requestStmt = $pdo->prepare("
    SELECT
        br.id,
        br.tracking_number,
        br.status,
        br.delivery_channel,

        sp.user_id AS seeker_user_id,

        u.email AS seeker_email,
        u.phone AS seeker_phone

    FROM blood_requests br

    INNER JOIN seeker_profiles sp
        ON sp.id = br.seeker_id

    INNER JOIN users u
        ON u.id = sp.user_id

    WHERE br.id = ?
      AND br.hospital_id = ?

    LIMIT 1
");

$requestStmt->execute([
    $requestId,
    $hospitalId
]);

$request = $requestStmt->fetch();

if (!$request) {
    jsonResponse(
        false,
        'Blood request not found in your hospital',
        [],
        404
    );
}

if ($request['status'] !== 'Submitted') {
    jsonResponse(
        false,
        'Only submitted requests can be moved to Under Review',
        [],
        400
    );
}


$deliveryChannel = $request['delivery_channel'];

$smsStatus =
    in_array($deliveryChannel, ['SMS', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';

$emailStatus =
    in_array($deliveryChannel, ['Email', 'Both'], true)
        ? 'Pending'
        : 'Not Selected';


try {

    $pdo->beginTransaction();


    $updateStmt = $pdo->prepare("
        UPDATE blood_requests
        SET
            status = 'Under Review',
            processed_by = ?
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Submitted'
    ");

    $updateStmt->execute([
        $_SESSION['user_id'],
        $requestId,
        $hospitalId
    ]);


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
            'Submitted',
            'Under Review',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $requestId,
        $_SESSION['user_id'],
        'Blood request is now under review'
    ]);


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
            ?,
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

    $subject = 'Blood Request Under Review';

    $message =
        'Your blood request ' .
        $request['tracking_number'] .
        ' is now under review.';


    $notificationStmt->execute([
        $request['seeker_user_id'],
        $_SESSION['user_id'],
        $subject,
        $message,
        $deliveryChannel,
        $request['seeker_phone'],
        $request['seeker_email'],
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
        'Blood request moved to Under Review',
        [
            'request_id' => $requestId,
            'tracking_number' => $request['tracking_number'],
            'status' => 'Under Review',
            'delivery_channel' => $deliveryChannel
        ]
    );


} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to update blood request',
        [],
        500
    );
}