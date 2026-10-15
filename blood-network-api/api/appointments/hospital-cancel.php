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

requirePermission('MANAGE_APPOINTMENTS');


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}


$data = getJsonInput();


$missing = requiredFields(
    $data,
    [
        'appointment_id'
    ]
);


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


$appointmentId =
    (int) $data['appointment_id'];


$database = new Database();
$pdo = $database->connect();


/*
|--------------------------------------------------------------------------
| FIND APPOINTMENT INSIDE PERSONNEL HOSPITAL
|--------------------------------------------------------------------------
*/

$stmt = $pdo->prepare("
    SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.delivery_channel,
        a.status,

        d.id AS donor_id,

        u.id AS donor_user_id,
        u.full_name AS donor_name,
        u.email AS donor_email,
        u.phone AS donor_phone,

        h.name AS hospital_name

    FROM appointments a

    INNER JOIN donor_profiles d
        ON d.id = a.donor_id

    INNER JOIN users u
        ON u.id = d.user_id

    INNER JOIN hospitals h
        ON h.id = a.hospital_id

    WHERE a.id = ?
      AND a.hospital_id = ?

    LIMIT 1
");


$stmt->execute([
    $appointmentId,
    $hospitalId
]);


$appointment = $stmt->fetch();


if (!$appointment) {
    jsonResponse(
        false,
        'Appointment not found in your hospital',
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


/*
|--------------------------------------------------------------------------
| CANCEL APPOINTMENT
|--------------------------------------------------------------------------
*/

try {

    $pdo->beginTransaction();


    $updateStmt = $pdo->prepare("
        UPDATE appointments

        SET
            status = 'Cancelled',
            cancelled_by = ?,
            cancelled_at = NOW()

        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Scheduled'
    ");


    $updateStmt->execute([
        $_SESSION['user_id'],
        $appointmentId,
        $hospitalId
    ]);


    if ($updateStmt->rowCount() !== 1) {

        $pdo->rollBack();

        jsonResponse(
            false,
            'Unable to cancel this appointment',
            [],
            409
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE DONOR NOTIFICATION
    |--------------------------------------------------------------------------
    */

    $deliveryChannel =
        $appointment['delivery_channel'];


    $smsStatus =
        in_array(
            $deliveryChannel,
            ['SMS', 'Both'],
            true
        )
            ? 'Pending'
            : 'Not Selected';


    $emailStatus =
        in_array(
            $deliveryChannel,
            ['Email', 'Both'],
            true
        )
            ? 'Pending'
            : 'Not Selected';


    $subject =
        'Donation Appointment Cancelled';


    $message =
        'Your donation appointment at ' .
        $appointment['hospital_name'] .
        ' scheduled for ' .
        $appointment['appointment_date'] .
        ' at ' .
        $appointment['appointment_time'] .
        ' has been cancelled by the hospital.';


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


    $notificationStmt->execute([
        $appointment['donor_user_id'],
        $_SESSION['user_id'],
        $subject,
        $message,
        $deliveryChannel,
        $appointment['donor_phone'],
        $appointment['donor_email'],
        $smsStatus,
        $emailStatus,
        $appointmentId
    ]);


    $notificationId =
        (int) $pdo->lastInsertId();


    $pdo->commit();


    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL / SMS
    |--------------------------------------------------------------------------
    */

    deliverNotification(
        $pdo,
        $notificationId
    );


    jsonResponse(
        true,
        'Appointment cancelled successfully',
        [
            'appointment_id' =>
                $appointmentId,

            'donor_id' =>
                (int) $appointment['donor_id'],

            'donor_name' =>
                $appointment['donor_name'],

            'hospital_id' =>
                $hospitalId,

            'status' =>
                'Cancelled'
        ]
    );


} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    jsonResponse(
        false,
        'Unable to cancel appointment',
        [],
        500
    );
}