<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
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

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    UPDATE notifications
    SET
        is_read = 1,
        read_at = NOW()
    WHERE recipient_user_id = ?
      AND is_read = 0
");

$stmt->execute([
    $_SESSION['user_id']
]);

jsonResponse(
    true,
    'All notifications marked as read',
    [
        'updated_count' => $stmt->rowCount()
    ]
);