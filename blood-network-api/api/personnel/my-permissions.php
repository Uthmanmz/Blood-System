<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['personnel']);

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT permission
    FROM personnel_permissions
    WHERE personnel_user_id = ?
    ORDER BY permission ASC
");

$stmt->execute([
    $_SESSION['user_id']
]);

$rows = $stmt->fetchAll();

$permissions = [];

foreach ($rows as $row) {
    $permissions[] = $row['permission'];
}

jsonResponse(
    true,
    'Personnel permissions retrieved successfully',
    [
        'user_id' => (int) $_SESSION['user_id'],
        'hospital_id' => (int) $_SESSION['hospital_id'],
        'permissions' => $permissions
    ]
);