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

try {

    $pdo->beginTransaction();


    // Lock the blood request.
    $requestStmt = $pdo->prepare("
        SELECT
            br.id,
            br.tracking_number,
            br.quantity,
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


    if ($request['status'] !== 'Ready for Collection') {

        $pdo->rollBack();

        jsonResponse(
            false,
            'Only requests Ready for Collection can be completed',
            [],
            400
        );
    }


    /*
     * Get and lock all blood units currently allocated
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
          AND bu.hospital_id = ?
          AND bru.released_at IS NULL
          AND bru.issued_at IS NULL

        FOR UPDATE
    ");

    $unitsStmt->execute([
        $requestId,
        $hospitalId
    ]);

    $units = $unitsStmt->fetchAll();


    if (count($units) !== (int) $request['quantity']) {

        $pdo->rollBack();

        jsonResponse(
            false,
            'The allocated blood units are incomplete',
            [],
            409
        );
    }


    foreach ($units as $unit) {

        if ($unit['status'] !== 'Reserved') {

            $pdo->rollBack();

            jsonResponse(
                false,
                'One or more blood units are no longer reserved',
                [],
                409
            );
        }


        if ($unit['expiry_date'] < date('Y-m-d')) {

            $pdo->rollBack();

            jsonResponse(
                false,
                'One or more reserved blood units have expired',
                [],
                409
            );
        }
    }


    $issueUnitStmt = $pdo->prepare("
        UPDATE blood_units
        SET status = 'Issued'
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Reserved'
    ");


    $allocationStmt = $pdo->prepare("
        UPDATE blood_request_units
        SET issued_at = NOW()
        WHERE blood_request_id = ?
          AND blood_unit_id = ?
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
            'Issued',
            ?,
            ?
        )
    ");


    $issuedUnits = [];


    foreach ($units as $unit) {

        $issueUnitStmt->execute([
            $unit['id'],
            $hospitalId
        ]);

        if ($issueUnitStmt->rowCount() !== 1) {
            throw new Exception(
                'Unable to issue one of the reserved blood units'
            );
        }


        $allocationStmt->execute([
            $requestId,
            $unit['id']
        ]);


        $unitHistoryStmt->execute([
            $unit['id'],
            $_SESSION['user_id'],
            'Blood unit issued for request ' .
            $request['tracking_number']
        ]);


        $issuedUnits[] = [
            'blood_unit_id' => (int) $unit['id'],
            'unit_code' => $unit['unit_code']
        ];
    }


    $requestUpdate = $pdo->prepare("
        UPDATE blood_requests
        SET
            status = 'Completed',
            processed_by = ?,
            completed_at = NOW()
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Ready for Collection'
    ");

    $requestUpdate->execute([
        $_SESSION['user_id'],
        $requestId,
        $hospitalId
    ]);


    if ($requestUpdate->rowCount() !== 1) {
        throw new Exception(
            'Unable to complete blood request'
        );
    }


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
            'Ready for Collection',
            'Completed',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $requestId,
        $_SESSION['user_id'],
        'Blood collected and request completed'
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


    $subject = 'Blood Request Completed';

    $message =
        'Your blood request ' .
        $request['tracking_number'] .
        ' has been completed successfully.';


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
        'Blood request completed successfully',
        [
            'request_id' => $requestId,
            'tracking_number' => $request['tracking_number'],
            'status' => 'Completed',
            'issued_units' => $issuedUnits,
            'delivery_channel' => $deliveryChannel
        ]
    );


} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to complete blood request',
        [],
        500
    );
}