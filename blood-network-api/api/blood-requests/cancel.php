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
        'Request ID and cancellation reason are required',
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
        'Cancellation reason cannot be empty',
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
        'Under Review',
        'Approved',
        'Ready for Collection'
    ];

    if (!in_array($request['status'], $allowedStatuses, true)) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'This blood request cannot be cancelled',
            [],
            400
        );
    }

    $oldStatus = $request['status'];


    /*
     * Find any active reserved blood units attached
     * to this request.
     */
    $unitsStmt = $pdo->prepare("
        SELECT
            bu.id,
            bu.unit_code,
            bu.status,
            bu.expiry_date

        FROM blood_request_units bru

        INNER JOIN blood_units bu
            ON bu.id = bru.blood_unit_id

        WHERE bru.blood_request_id = ?
          AND bru.released_at IS NULL
          AND bru.issued_at IS NULL

        FOR UPDATE
    ");

    $unitsStmt->execute([
        $requestId
    ]);

    $units = $unitsStmt->fetchAll();


    $releaseUnitStmt = $pdo->prepare("
        UPDATE blood_units
        SET status = ?
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Reserved'
    ");

    $releaseAllocationStmt = $pdo->prepare("
        UPDATE blood_request_units
        SET released_at = NOW()
        WHERE blood_request_id = ?
          AND blood_unit_id = ?
          AND released_at IS NULL
          AND issued_at IS NULL
    ");

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
            'Reserved',
            ?,
            ?,
            ?
        )
    ");

    $releasedUnits = [];


    foreach ($units as $unit) {

        if ($unit['status'] !== 'Reserved') {
            continue;
        }

        $newUnitStatus =
            $unit['expiry_date'] < date('Y-m-d')
                ? 'Expired'
                : 'Available';


        $releaseUnitStmt->execute([
            $newUnitStatus,
            $unit['id'],
            $hospitalId
        ]);


        if ($releaseUnitStmt->rowCount() !== 1) {
            throw new Exception(
                'Unable to release reserved blood unit'
            );
        }


        $releaseAllocationStmt->execute([
            $requestId,
            $unit['id']
        ]);


        $unitHistoryStmt->execute([
            $unit['id'],
            $newUnitStatus,
            $_SESSION['user_id'],
            'Blood unit released because request ' .
            $request['tracking_number'] .
            ' was cancelled'
        ]);


        $releasedUnits[] = [
            'blood_unit_id' => (int) $unit['id'],
            'unit_code' => $unit['unit_code'],
            'new_status' => $newUnitStatus
        ];
    }


    $updateStmt = $pdo->prepare("
        UPDATE blood_requests
        SET
            status = 'Cancelled',
            processed_by = ?,
            cancellation_reason = ?,
            cancelled_at = NOW()
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
            'Cancelled',
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


    $subject = 'Blood Request Cancelled';

    $message =
        'Your blood request ' .
        $request['tracking_number'] .
        ' was cancelled. Reason: ' .
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
        'Blood request cancelled successfully',
        [
            'request_id' => $requestId,
            'tracking_number' => $request['tracking_number'],
            'previous_status' => $oldStatus,
            'status' => 'Cancelled',
            'reason' => $reason,
            'released_units' => $releasedUnits,
            'delivery_channel' => $deliveryChannel
        ]
    );


} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to cancel blood request',
        [],
        500
    );
}