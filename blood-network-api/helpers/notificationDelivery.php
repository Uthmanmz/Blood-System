<?php

require_once __DIR__ . '/email.php';
require_once __DIR__ . '/sms.php';


function deliverNotification(
    PDO $pdo,
    int $notificationId
): array {

    $stmt = $pdo->prepare("
        SELECT
            n.id,
            n.subject,
            n.message,
            n.delivery_channel,
            n.phone_number,
            n.email_address,
            n.sms_status,
            n.email_status,

            u.full_name AS recipient_name

        FROM notifications n

        INNER JOIN users u
            ON u.id = n.recipient_user_id

        WHERE n.id = ?

        LIMIT 1
    ");

    $stmt->execute([
        $notificationId
    ]);

    $notification = $stmt->fetch();

    if (!$notification) {
        return [
            'success' => false,
            'message' => 'Notification not found'
        ];
    }


    $smsStatus = $notification['sms_status'];
    $emailStatus = $notification['email_status'];

    $smsError = null;
    $emailError = null;

    $sentAnything = false;


    /*
     * EMAIL DELIVERY
     */
    if (
        in_array(
            $notification['delivery_channel'],
            ['Email', 'Both'],
            true
        )
        &&
        $emailStatus === 'Pending'
    ) {

        $emailResult = sendEmail(
            $notification['email_address'],
            $notification['recipient_name'],
            $notification['subject'],
            $notification['message']
        );

        if ($emailResult['success']) {

            $emailStatus = 'Sent';
            $sentAnything = true;

        } else {

            $emailStatus = 'Failed';
            $emailError = $emailResult['message'];
        }
    }


    /*
     * SMS DELIVERY
     */
    if (
        in_array(
            $notification['delivery_channel'],
            ['SMS', 'Both'],
            true
        )
        &&
        $smsStatus === 'Pending'
    ) {

        $smsResult = sendSMS(
            $notification['phone_number'],
            $notification['message']
        );


        /*
         * No API token yet:
         * keep SMS Pending instead of falsely
         * marking it Failed.
         */
        if (
            isset($smsResult['configured'])
            &&
            $smsResult['configured'] === false
        ) {

            $smsStatus = 'Pending';
            $smsError = $smsResult['message'];

        } elseif ($smsResult['success']) {

            $smsStatus = 'Sent';
            $sentAnything = true;

        } else {

            $smsStatus = 'Failed';
            $smsError = $smsResult['message'];
        }
    }


    $updateStmt = $pdo->prepare("
        UPDATE notifications

        SET
            sms_status = ?,
            sms_sent_at =
                CASE
                    WHEN ? = 'Sent'
                    THEN COALESCE(sms_sent_at, NOW())
                    ELSE sms_sent_at
                END,

            sms_error = ?,

            email_status = ?,
            email_sent_at =
                CASE
                    WHEN ? = 'Sent'
                    THEN COALESCE(email_sent_at, NOW())
                    ELSE email_sent_at
                END,

            email_error = ?

        WHERE id = ?
    ");

    $updateStmt->execute([
        $smsStatus,
        $smsStatus,
        $smsError,

        $emailStatus,
        $emailStatus,
        $emailError,

        $notificationId
    ]);


    return [
        'success' => true,
        'notification_id' => $notificationId,
        'delivery_channel' => $notification['delivery_channel'],
        'sms_status' => $smsStatus,
        'email_status' => $emailStatus,
        'sms_error' => $smsError,
        'email_error' => $emailError,
        'sent_anything' => $sentAnything
    ];
}