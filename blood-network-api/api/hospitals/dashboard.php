<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/hospitalScope.php';

requireAuth();

requireRole([
    'hospital_admin',
    'personnel'
]);

$hospitalId = requireHospitalScope();

$database = new Database();
$pdo = $database->connect();


$donorStmt = $pdo->prepare("
    SELECT COUNT(*) AS total
    FROM donor_profiles
    WHERE registration_hospital_id = ?
");

$donorStmt->execute([$hospitalId]);

$donorCount = $donorStmt->fetch();


$appointmentStmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Scheduled') AS scheduled,
        SUM(status = 'Completed') AS completed,
        SUM(status = 'Cancelled') AS cancelled
    FROM appointments
    WHERE hospital_id = ?
");

$appointmentStmt->execute([$hospitalId]);

$appointments = $appointmentStmt->fetch();


$donationStmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Completed') AS completed
    FROM donations
    WHERE hospital_id = ?
");

$donationStmt->execute([$hospitalId]);

$donations = $donationStmt->fetch();


$requestStmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Submitted') AS submitted,
        SUM(status = 'Under Review') AS under_review,
        SUM(status = 'Approved') AS approved,
        SUM(status = 'Ready for Collection') AS ready,
        SUM(status = 'Completed') AS completed
    FROM blood_requests
    WHERE hospital_id = ?
");

$requestStmt->execute([$hospitalId]);

$requests = $requestStmt->fetch();


$inventoryStmt = $pdo->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Available') AS available,
        SUM(status = 'Reserved') AS reserved,
        SUM(status = 'Issued') AS issued,
        SUM(status = 'Awaiting Screening') AS awaiting_screening
    FROM blood_units
    WHERE hospital_id = ?
");

$inventoryStmt->execute([$hospitalId]);

$inventory = $inventoryStmt->fetch();


jsonResponse(
    true,
    'Hospital dashboard retrieved successfully',
    [
        'hospital_id' => $hospitalId,

        'donors' => [
            'total' => (int) $donorCount['total']
        ],

        'appointments' => [
            'total' => (int) $appointments['total'],
            'scheduled' => (int) $appointments['scheduled'],
            'completed' => (int) $appointments['completed'],
            'cancelled' => (int) $appointments['cancelled']
        ],

        'donations' => [
            'total' => (int) $donations['total'],
            'completed' => (int) $donations['completed']
        ],

        'blood_requests' => [
            'total' => (int) $requests['total'],
            'submitted' => (int) $requests['submitted'],
            'under_review' => (int) $requests['under_review'],
            'approved' => (int) $requests['approved'],
            'ready' => (int) $requests['ready'],
            'completed' => (int) $requests['completed']
        ],

        'inventory' => [
            'total' => (int) $inventory['total'],
            'available' => (int) $inventory['available'],
            'reserved' => (int) $inventory['reserved'],
            'issued' => (int) $inventory['issued'],
            'awaiting_screening' => (int) $inventory['awaiting_screening']
        ]
    ]
);