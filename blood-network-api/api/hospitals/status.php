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
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}

$data = getJsonInput();

$missing = requiredFields($data, [
    'hospital_id',
    'status'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Hospital ID and status are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$hospitalId = (int) $data['hospital_id'];
$newStatus = trim($data['status']);

$reason = isset($data['reason'])
    ? trim($data['reason'])
    : null;

$allowedStatuses = [
    'Approved',
    'Rejected',
    'Suspended'
];

if (!in_array($newStatus, $allowedStatuses, true)) {
    jsonResponse(
        false,
        'Status must be Approved, Rejected or Suspended',
        [],
        400
    );
}

if (
    in_array($newStatus, ['Rejected', 'Suspended'], true)
    && !$reason
) {
    jsonResponse(
        false,
        'A reason is required for rejection or suspension',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

try {

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT
            id,
            name,
            status
        FROM hospitals
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        $hospitalId
    ]);

    $hospital = $stmt->fetch();

    if (!$hospital) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Hospital not found',
            [],
            404
        );
    }

    $oldStatus = $hospital['status'];

    if ($oldStatus === $newStatus) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Hospital already has this status',
            [],
            400
        );
    }

    /*
     * Valid transitions
     */
    $allowedTransitions = [
        'Pending' => [
            'Approved',
            'Rejected'
        ],
        'Approved' => [
            'Suspended'
        ],
        'Suspended' => [
            'Approved'
        ],
        'Rejected' => [
            'Approved'
        ]
    ];

    if (
        !isset($allowedTransitions[$oldStatus]) ||
        !in_array(
            $newStatus,
            $allowedTransitions[$oldStatus],
            true
        )
    ) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'This hospital status transition is not allowed',
            [
                'current_status' => $oldStatus,
                'requested_status' => $newStatus
            ],
            400
        );
    }

    if ($newStatus === 'Approved') {

        $updateStmt = $pdo->prepare("
            UPDATE hospitals
            SET
                status = 'Approved',
                rejection_reason = NULL,
                suspension_reason = NULL,
                reviewed_at = NOW(),
                suspended_at = NULL
            WHERE id = ?
        ");

        $updateStmt->execute([
            $hospitalId
        ]);
    }

    if ($newStatus === 'Rejected') {

        $updateStmt = $pdo->prepare("
            UPDATE hospitals
            SET
                status = 'Rejected',
                rejection_reason = ?,
                suspension_reason = NULL,
                reviewed_at = NOW(),
                suspended_at = NULL
            WHERE id = ?
        ");

        $updateStmt->execute([
            $reason,
            $hospitalId
        ]);
    }

    if ($newStatus === 'Suspended') {

        $updateStmt = $pdo->prepare("
            UPDATE hospitals
            SET
                status = 'Suspended',
                suspension_reason = ?,
                suspended_at = NOW()
            WHERE id = ?
        ");

        $updateStmt->execute([
            $reason,
            $hospitalId
        ]);
    }

    $historyStmt = $pdo->prepare("
        INSERT INTO hospital_status_history (
            hospital_id,
            old_status,
            new_status,
            changed_by,
            reason
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $hospitalId,
        $oldStatus,
        $newStatus,
        $_SESSION['user_id'],
        $reason
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Hospital status updated successfully',
        [
            'hospital_id' => $hospitalId,
            'hospital_name' => $hospital['name'],
            'previous_status' => $oldStatus,
            'status' => $newStatus,
            'reason' => $reason
        ]
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to update hospital status',
        [],
        500
    );
}