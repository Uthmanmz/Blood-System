<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['organisation_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Only POST requests are allowed', [], 405);
}

$data = getJsonInput();

$missing = requiredFields($data, [
    'title',
    'message',
    'notice_type'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Title, message and notice type are required',
        ['missing_fields' => $missing],
        400
    );
}

$title = trim($data['title']);
$message = trim($data['message']);
$noticeType = trim($data['notice_type']);

$hospitalIds = isset($data['hospital_ids'])
    && is_array($data['hospital_ids'])
        ? $data['hospital_ids']
        : [];

$sendToAll = !empty($data['send_to_all']);

$allowedTypes = [
    'General',
    'Important',
    'Policy',
    'Operational'
];

if (!in_array($noticeType, $allowedTypes, true)) {
    jsonResponse(false, 'Invalid notice type', [], 400);
}

$database = new Database();
$pdo = $database->connect();

try {

    $pdo->beginTransaction();

    $noticeStmt = $pdo->prepare("
        INSERT INTO organisation_notices (
            sent_by,
            title,
            message,
            notice_type
        )
        VALUES (?, ?, ?, ?)
    ");

    $noticeStmt->execute([
        $_SESSION['user_id'],
        $title,
        $message,
        $noticeType
    ]);

    $noticeId = (int) $pdo->lastInsertId();


    if ($sendToAll) {

        $hospitalStmt = $pdo->query("
            SELECT id
            FROM hospitals
            WHERE status = 'Approved'
        ");

        $hospitalIds = array_column(
            $hospitalStmt->fetchAll(),
            'id'
        );
    }


    if (empty($hospitalIds)) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Select at least one hospital',
            [],
            400
        );
    }


    $recipientStmt = $pdo->prepare("
        INSERT INTO organisation_notice_recipients (
            notice_id,
            hospital_id
        )
        VALUES (?, ?)
    ");

    foreach ($hospitalIds as $hospitalId) {

        $checkStmt = $pdo->prepare("
            SELECT id
            FROM hospitals
            WHERE id = ?
              AND status = 'Approved'
            LIMIT 1
        ");

        $checkStmt->execute([
            (int) $hospitalId
        ]);

        if (!$checkStmt->fetch()) {
            continue;
        }

        $recipientStmt->execute([
            $noticeId,
            (int) $hospitalId
        ]);
    }

    $pdo->commit();

    jsonResponse(
        true,
        'Organisation notice created successfully',
        [
            'notice_id' => $noticeId,
            'title' => $title,
            'notice_type' => $noticeType,
            'recipient_hospitals' => count($hospitalIds)
        ],
        201
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to create organisation notice',
        [],
        500
    );
}