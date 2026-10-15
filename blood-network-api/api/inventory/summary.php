<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';
require_once __DIR__ . '/../../middleware/permission.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

if ($_SESSION['role'] === 'personnel') {
    requirePermission('MANAGE_INVENTORY');
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total_units,

        SUM(status = 'Awaiting Screening') AS awaiting_screening,
        SUM(status = 'Available') AS available,
        SUM(status = 'Reserved') AS reserved,
        SUM(status = 'Issued') AS issued,
        SUM(status = 'Expired') AS expired,
        SUM(status = 'Discarded') AS discarded

    FROM blood_units

    WHERE hospital_id = ?
");

$stmt->execute([
    $hospitalId
]);

$summary = $stmt->fetch();

jsonResponse(
    true,
    'Inventory summary retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'summary' => [
            'total_units' => (int) $summary['total_units'],
            'awaiting_screening' => (int) $summary['awaiting_screening'],
            'available' => (int) $summary['available'],
            'reserved' => (int) $summary['reserved'],
            'issued' => (int) $summary['issued'],
            'expired' => (int) $summary['expired'],
            'discarded' => (int) $summary['discarded']
        ]
    ]
);