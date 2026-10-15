<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function requirePermission(string $permission): void
{
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        jsonResponse(
            false,
            'Authentication required',
            [],
            401
        );
    }

    if ($_SESSION['role'] !== 'personnel') {
        jsonResponse(
            false,
            'This action is only available to personnel',
            [],
            403
        );
    }

    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT id
        FROM personnel_permissions
        WHERE personnel_user_id = ?
        AND permission = ?
        LIMIT 1
    ");

    $stmt->execute([
        $_SESSION['user_id'],
        $permission
    ]);

    if (!$stmt->fetch()) {
        jsonResponse(
            false,
            'You do not have permission to perform this action',
            [],
            403
        );
    }
}