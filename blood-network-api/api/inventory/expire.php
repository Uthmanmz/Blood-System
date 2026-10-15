<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

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

        WHERE hospital_id = ?
          AND expiry_date < CURDATE()
          AND status IN (
              'Awaiting Screening',
              'Available'
          )

        FOR UPDATE
    ");

    $stmt->execute([
        $hospitalId
    ]);

    $units = $stmt->fetchAll();

    $updateStmt = $pdo->prepare("
        UPDATE blood_units
        SET status = 'Expired'
        WHERE id = ?
          AND hospital_id = ?
    ");

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
            'Expired',
            ?,
            ?
        )
    ");

    $expiredUnits = [];

    foreach ($units as $unit) {

        $updateStmt->execute([
            $unit['id'],
            $hospitalId
        ]);

        $historyStmt->execute([
            $unit['id'],
            $unit['status'],
            $_SESSION['user_id'],
            'Blood unit automatically marked expired'
        ]);

        $expiredUnits[] = [
            'blood_unit_id' => (int) $unit['id'],
            'unit_code' => $unit['unit_code']
        ];
    }

    $pdo->commit();

    jsonResponse(
        true,
        'Expired blood units processed successfully',
        [
            'expired_count' => count($expiredUnits),
            'expired_units' => $expiredUnits
        ]
    );

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        'Unable to process expired blood units',
        [],
        500
    );
}