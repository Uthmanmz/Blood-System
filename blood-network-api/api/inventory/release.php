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
    'blood_unit_id'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Blood unit ID is required',
        [
            'missing_fields' => $missing
        ],
        400
    );
}

$bloodUnitId = (int) $data['blood_unit_id'];

$database = new Database();
$pdo = $database->connect();

$unitStmt = $pdo->prepare("
    SELECT
        id,
        unit_code,
        status,
        expiry_date
    FROM blood_units
    WHERE id = ?
      AND hospital_id = ?
    LIMIT 1
");

$unitStmt->execute([
    $bloodUnitId,
    $hospitalId
]);

$unit = $unitStmt->fetch();

if (!$unit) {
    jsonResponse(
        false,
        'Blood unit not found in your hospital',
        [],
        404
    );
}

if ($unit['status'] !== 'Awaiting Screening') {
    jsonResponse(
        false,
        'Only units awaiting screening can be released',
        [],
        400
    );
}

$today = new DateTime();
$expiryDate = new DateTime($unit['expiry_date']);

if ($expiryDate < $today) {
    jsonResponse(
        false,
        'Expired blood units cannot be released',
        [],
        400
    );
}

try {

    $pdo->beginTransaction();

    $updateStmt = $pdo->prepare("
        UPDATE blood_units
        SET
            status = 'Available',
            released_by = ?,
            released_at = NOW()
        WHERE id = ?
          AND hospital_id = ?
          AND status = 'Awaiting Screening'
    ");

    $updateStmt->execute([
        $_SESSION['user_id'],
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
            'Awaiting Screening',
            'Available',
            ?,
            ?
        )
    ");

    $historyStmt->execute([
        $bloodUnitId,
        $_SESSION['user_id'],
        'Blood unit released after screening'
    ]);

    $pdo->commit();

    jsonResponse(
        true,
        'Blood unit released successfully',
        [
            'blood_unit_id' => $bloodUnitId,
            'unit_code' => $unit['unit_code'],
            'status' => 'Available'
        ]
    );

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to release blood unit',
        [],
        500
    );
}