<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';

requireAuth();
requireRole(['hospital_admin']);

$hospitalId = requireHospitalScope();

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.account_status,
        u.created_at,

        p.staff_number,
        p.job_title

    FROM users u

    INNER JOIN personnel_profiles p
        ON p.user_id = u.id

    WHERE u.role = 'personnel'
      AND u.hospital_id = ?

    ORDER BY u.created_at DESC
");

$stmt->execute([
    $hospitalId
]);

$personnel = $stmt->fetchAll();

foreach ($personnel as &$person) {

    $permissionStmt = $pdo->prepare("
        SELECT permission
        FROM personnel_permissions
        WHERE personnel_user_id = ?
        ORDER BY permission ASC
    ");

    $permissionStmt->execute([
        $person['id']
    ]);

    $permissionRows = $permissionStmt->fetchAll();

    $person['permissions'] = array_column(
        $permissionRows,
        'permission'
    );
}

jsonResponse(
    true,
    'Personnel retrieved successfully',
    [
        'hospital_id' => $hospitalId,
        'personnel' => $personnel
    ]
);