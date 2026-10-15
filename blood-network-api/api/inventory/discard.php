<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';
require_once __DIR__ . '/../../middleware/permission.php';

requireAuth();
requireRole(['personnel']);

$hospitalId = requireHospitalScope();

requirePermission('MANAGE_INVENTORY');

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
    'blood_unit_id',
    'reason'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Blood unit ID and discard reason are required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$bloodUnitId = (int) $data['blood_unit_id'];
$reason = trim($data['reason']);

if ($reason === '') {
    jsonResponse(
        false,
        'Discard reason cannot be empty',
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
            unit_code,
            status

        FROM blood_units

        WHERE id = ?
          AND hospital_id = ?

        LIMIT 1

        FOR UPDATE
    ");

    $stmt->execute([
        $bloodUnitId,
        $hospitalId
    ]);

    $unit = $stmt->fetch();

    if (!$unit) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Blood unit not found in your hospital',
            [],
            404
        );
    }

    $allowedStatuses = [
        'Awaiting Screening',
        'Available'
    ];

    if (!in_array($unit['status'], $allowedStatuses, true)) {
        $pdo->rollBack();

        jsonResponse(
            false,
            'Only Awaiting Screening or Available blood units can be discarded',
            [],
            400
        );
    }

    $oldStatus = $unit['status'];

    $updateStmt = $pdo->prepare("
        UPDATE blood_units

        SET
            status = 'Discarded',
            discarded_by = ?,
            discarded_at = NOW(),
            discard_reason = ?

        WHERE id = ?
          AND hospital_id = ?
    ");

    $updateStmt->execute([
        $_SESSION['user_id'],
        $reason,
        $bloodUnitId,
        $hospitalId
    ]);

    $historyStmt = $pdo->prepare("
        INSERT INTO blood_unit_history (
            blood_unit_id,
            old_status,
            new_status,
            changed_by,
            note
        )
        VALUES (
            ?,
            ?,
            'Discarded',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $bloodUnitId,
        $oldStatus,
        $_SESSION['user_id'],
        $reason
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Blood unit discarded successfully',
        [
            'blood_unit_id' => $bloodUnitId,
            'unit_code' => $unit['unit_code'],
            'previous_status' => $oldStatus,
            'status' => 'Discarded',
            'reason' => $reason
        ]
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to discard blood unit',
        [],
        500
    );
}