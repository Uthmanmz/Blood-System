<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function requireHospitalScope(): int
{
    if (
        !isset($_SESSION['role']) ||
        !in_array(
            $_SESSION['role'],
            ['hospital_admin', 'personnel'],
            true
        )
    ) {
        jsonResponse(
            false,
            'Hospital access is not allowed for this account',
            [],
            403
        );
    }

    if (empty($_SESSION['hospital_id'])) {
        jsonResponse(
            false,
            'No hospital is assigned to this account',
            [],
            403
        );
    }

    $hospitalId = (int) $_SESSION['hospital_id'];

    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT
            id,
            status
        FROM hospitals
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([
        $hospitalId
    ]);

    $hospital = $stmt->fetch();

    if (!$hospital) {
        jsonResponse(
            false,
            'Assigned hospital was not found',
            [],
            403
        );
    }

    if ($hospital['status'] !== 'Approved') {
        jsonResponse(
            false,
            'Your hospital is currently not approved for system operations',
            [
                'hospital_status' => $hospital['status']
            ],
            403
        );
    }

    return $hospitalId;
}