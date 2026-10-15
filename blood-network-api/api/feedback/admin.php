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

$database = new Database();
$pdo = $database->connect();


if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $stmt = $pdo->query("
        SELECT
            f.id,
            f.full_name,
            f.email,
            f.phone,
            f.subject,
            f.message,
            f.status,
            f.reviewed_at,
            f.admin_note,
            f.created_at,

            u.full_name AS reviewed_by_name

        FROM feedback f

        LEFT JOIN users u
            ON u.id = f.reviewed_by

        ORDER BY
            CASE
                WHEN f.status = 'New' THEN 1
                WHEN f.status = 'Reviewed' THEN 2
                ELSE 3
            END,
            f.created_at DESC
    ");

    jsonResponse(
        true,
        'Feedback retrieved successfully',
        [
            'feedback' => $stmt->fetchAll()
        ]
    );
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = getJsonInput();

    $missing = requiredFields($data, [
        'feedback_id',
        'status'
    ]);

    if (!empty($missing)) {
        jsonResponse(
            false,
            'Feedback ID and status are required',
            [],
            400
        );
    }

    $feedbackId = (int) $data['feedback_id'];
    $status = trim($data['status']);

    $adminNote = isset($data['admin_note'])
        ? trim($data['admin_note'])
        : null;

    $allowedStatuses = [
        'New',
        'Reviewed',
        'Resolved'
    ];

    if (!in_array($status, $allowedStatuses, true)) {
        jsonResponse(false, 'Invalid feedback status', [], 400);
    }

    $stmt = $pdo->prepare("
        UPDATE feedback
        SET
            status = ?,
            reviewed_by = ?,
            reviewed_at = NOW(),
            admin_note = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $status,
        $_SESSION['user_id'],
        $adminNote ?: null,
        $feedbackId
    ]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(
            false,
            'Feedback not found or no changes were made',
            [],
            404
        );
    }

    jsonResponse(
        true,
        'Feedback updated successfully',
        [
            'feedback_id' => $feedbackId,
            'status' => $status
        ]
    );
}


jsonResponse(
    false,
    'Method not allowed',
    [],
    405
);