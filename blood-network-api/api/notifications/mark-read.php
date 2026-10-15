<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';

requireAuth();

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
    'notification_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Notification ID is required',
        [],
        400
    );
}

$notificationId = (int) $data['notification_id'];

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    UPDATE notifications
    SET
        is_read = 1,
        read_at = NOW()

    WHERE id = ?
      AND recipient_user_id = ?
");

$stmt->execute([
    $notificationId,
    $_SESSION['user_id']
]);

if ($stmt->rowCount() === 0) {
    jsonResponse(
        false,
        'Notification not found or already read',
        [],
        404
    );
}

jsonResponse(
    true,
    'Notification marked as read',
    [
        'notification_id' => $notificationId
    ]
);