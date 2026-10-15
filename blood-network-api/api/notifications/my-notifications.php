<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

requireAuth();

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        id,
        notification_type,
        subject,
        message,
        delivery_channel,
        sms_status,
        email_status,
        is_read,
        read_at,
        blood_request_id,
        donation_id,
        appointment_id,
        created_at

    FROM notifications

    WHERE recipient_user_id = ?

    ORDER BY created_at DESC
");

$stmt->execute([
    $_SESSION['user_id']
]);

$notifications = $stmt->fetchAll();

$countStmt = $pdo->prepare("
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE recipient_user_id = ?
      AND is_read = 0
");

$countStmt->execute([
    $_SESSION['user_id']
]);

$count = $countStmt->fetch();

jsonResponse(
    true,
    'Notifications retrieved successfully',
    [
        'unread_count' => (int) $count['unread_count'],
        'notifications' => $notifications
    ]
);