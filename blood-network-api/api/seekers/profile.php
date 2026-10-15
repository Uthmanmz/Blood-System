<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['seeker']);

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.account_status,

        s.id AS seeker_id,
        s.address,

        u.created_at

    FROM users u

    INNER JOIN seeker_profiles s
        ON s.user_id = u.id

    WHERE u.id = ?
      AND u.role = 'seeker'

    LIMIT 1
");

$stmt->execute([
    $_SESSION['user_id']
]);

$seeker = $stmt->fetch();

if (!$seeker) {
    jsonResponse(
        false,
        'Seeker profile not found',
        [],
        404
    );
}

jsonResponse(
    true,
    'Seeker profile retrieved successfully',
    [
        'seeker' => $seeker
    ]
);