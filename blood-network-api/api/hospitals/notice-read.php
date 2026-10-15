<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Only POST requests are allowed', [], 405);
}

$data = getJsonInput();

$missing = requiredFields($data, ['notice_id']);

if (!empty($missing)) {
    jsonResponse(false, 'Notice ID is required', [], 400);
}

$noticeId = (int) $data['notice_id'];

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    UPDATE organisation_notice_recipients

    SET
        is_read = 1,
        read_at = NOW()

    WHERE notice_id = ?
      AND hospital_id = ?
");

$stmt->execute([
    $noticeId,
    $hospitalId
]);

if ($stmt->rowCount() === 0) {
    jsonResponse(
        false,
        'Notice not found or already read',
        [],
        404
    );
}

jsonResponse(
    true,
    'Notice marked as read',
    [
        'notice_id' => $noticeId
    ]
);