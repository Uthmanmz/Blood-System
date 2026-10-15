<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

requireAuth();

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE recipient_user_id = ?
      AND is_read = 0
");

$stmt->execute([
    $_SESSION['user_id']
]);

$result = $stmt->fetch();

jsonResponse(
    true,
    'Unread notification count retrieved successfully',
    [
        'unread_count' => (int) $result['unread_count']
    ]
);