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


    // Lock the request so two personnel cannot approve it at the same time.
    $requestStmt = $pdo->prepare("
        SELECT
            br.id,
            br.tracking_number,
            br.blood_group,
            br.quantity,
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


    if ($request['status'] !== 'Under Review') {

        $pdo->rollBack();

        jsonResponse(
            false,
            'Only requests under review can be approved',
            [],
            400
        );
    }


    $quantity = (int) $request['quantity'];


    // Find and lock exact matching available blood units.
    $unitStmt = $pdo->prepare("
        SELECT
            id,
            unit_code,
            blood_group,
            expiry_date

        FROM blood_units

        WHERE hospital_id = ?
          AND blood_group = ?
          AND status = 'Available'
          AND expiry_date >= CURDATE()

        ORDER BY
            expiry_date ASC,
            id ASC

        LIMIT {$quantity}

        FOR UPDATE
    ");

    $unitStmt->execute([
        $hospitalId,
        $request['blood_group']
    ]);

    $units = $unitStmt->fetchAll();


    if (count($units) < $quantity) {

        $pdo->rollBack();

        jsonResponse(
            false,
            'Not enough matching blood units are currently available',
            [
                'blood_group' => $request['blood_group'],
                'requested_quantity' => $quantity,
                'available_quantity' => count($units)
            ],
            409
        );
    }


    $allocationStmt = $pdo->prepare("
        INSERT INTO blood_request_units (
            blood_request_id,
            blood_unit_id,
            allocated_by,
            allocated_at
        )
        VALUES (
            ?,
            ?,
            ?,
            NOW()
        )
    ");


    $reserveStmt = $pdo->prepare("
        UPDATE blood_units
        SET status = 'Reserved'
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Available'
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
            'Available',
            'Reserved',
            ?,
            ?
        )
    ");


    $allocatedUnits = [];


    foreach ($units as $unit) {

        $allocationStmt->execute([
            $requestId,
            $unit['id'],
            $_SESSION['user_id']
        ]);


        $reserveStmt->execute([
            $unit['id'],
            $hospitalId
        ]);


        if ($reserveStmt->rowCount() !== 1) {
            throw new Exception(
                'Unable to reserve one of the selected blood units'
            );
        }


        $unitHistoryStmt->execute([
            $unit['id'],
            $_SESSION['user_id'],
            'Blood unit reserved for request ' .
            $request['tracking_number']
        ]);


        $allocatedUnits[] = [
            'blood_unit_id' => (int) $unit['id'],
            'unit_code' => $unit['unit_code'],
            'blood_group' => $unit['blood_group']
        ];
    }


    $requestUpdate = $pdo->prepare("
        UPDATE blood_requests
        SET
            status = 'Approved',
            processed_by = ?,
            approved_at = NOW()
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Under Review'
    ");

    $requestUpdate->execute([
        $_SESSION['user_id'],
        $requestId,
        $hospitalId
    ]);


    if ($requestUpdate->rowCount() !== 1) {
        throw new Exception(
            'Unable to approve blood request'
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
            'Under Review',
            'Approved',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $requestId,
        $_SESSION['user_id'],
        'Matching blood unit(s) reserved and request approved'
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


    $subject = 'Blood Request Approved';

    $message =
        'Your blood request ' .
        $request['tracking_number'] .
        ' has been approved. ' .
        $quantity .
        ' matching blood unit(s) have been reserved.';


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
        'Blood request approved successfully',
        [
            'request_id' => $requestId,
            'tracking_number' => $request['tracking_number'],
            'status' => 'Approved',
            'blood_group' => $request['blood_group'],
            'quantity' => $quantity,
            'allocated_units' => $allocatedUnits,
            'delivery_channel' => $deliveryChannel
        ]
    );


} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to approve blood request',
        [],
        500
    );
}