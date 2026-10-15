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
requireRole(['personnel']);

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
    'request_id',
    'reason'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Request ID and rejection reason are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$requestId = (int) $data['request_id'];
$reason = trim($data['reason']);

if ($reason === '') {
    jsonResponse(
        false,
        'Rejection reason cannot be empty',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

try {

    $pdo->beginTransaction();

    $requestStmt = $pdo->prepare("
        SELECT
            br.id,
            br.tracking_number,
            br.status,
            br.delivery_channel,

            sp.user_id AS seeker_user_id,

            u.phone AS seeker_phone,
            u.email AS seeker_email

        FROM blood_requests br

        INNER JOIN seeker_profiles sp
            ON sp.id = br.seeker_id

        INNER JOIN users u
            ON u.id = sp.user_id

        WHERE br.id = ?
          AND br.hospital_id = ?

        LIMIT 1

        FOR UPDATE
    ");

    $requestStmt->execute([
        $requestId,
        $hospitalId
    ]);

    $request = $requestStmt->fetch();

    if (!$request) {

        $pdo->rollBack();

        jsonResponse(
            false,
            'Blood request not found in your hospital',
            [],
            404
        );
    }

    $allowedStatuses = [
        'Submitted',
        'Under Review'
    ];

    if (!in_array($request['status'], $allowedStatuses, true)) {

        $pdo->rollBack();

        jsonResponse(
            false,
            'This blood request can no longer be rejected',
            [],
            400
        );
    }

    $oldStatus = $request['status'];

    $updateStmt = $pdo->prepare("
        UPDATE blood_requests
        SET
            status = 'Rejected',
            processed_by = ?,
            rejection_reason = ?,
            rejected_at = NOW()
        WHERE id = ?
          AND hospital_id = ?
    ");

    $updateStmt->execute([
        $_SESSION['user_id'],
        $reason,
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
            ?,
            'Rejected',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $requestId,
        $oldStatus,
        $_SESSION['user_id'],
        $reason
    ]);

    $deliveryChannel = $request['delivery_channel'];

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

    $subject = 'Blood Request Rejected';

    $message =
        'Your blood request ' .
        $request['tracking_number'] .
        ' was rejected. Reason: ' .
        $reason;

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
        'Blood request rejected successfully',
        [
            'request_id' => $requestId,
            'tracking_number' => $request['tracking_number'],
            'status' => 'Rejected',
            'reason' => $reason,
            'delivery_channel' => $deliveryChannel
        ]
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to reject blood request',
        [],
        500
    );
}