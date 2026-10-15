<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['organisation_admin']);

$database = new Database();
$pdo = $database->connect();

$hospitalStmt = $pdo->query("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Approved') AS approved,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'Rejected') AS rejected,
        SUM(status = 'Suspended') AS suspended
    FROM hospitals
");

$hospitals = $hospitalStmt->fetch();


$donationStmt = $pdo->query("
    SELECT
        COUNT(*) AS total_donations,
        SUM(status = 'Completed') AS completed_donations
    FROM donations
");

$donations = $donationStmt->fetch();


$requestStmt = $pdo->query("
    SELECT
        COUNT(*) AS total_requests,
        SUM(status = 'Completed') AS completed_requests
    FROM blood_requests
");

$requests = $requestStmt->fetch();


jsonResponse(
    true,
    'Organisation analytics retrieved successfully',
    [
        'hospitals' => [
            'total' => (int) $hospitals['total'],
            'approved' => (int) $hospitals['approved'],
            'pending' => (int) $hospitals['pending'],
            'rejected' => (int) $hospitals['rejected'],
            'suspended' => (int) $hospitals['suspended']
        ],

        'donations' => [
            'total' => (int) $donations['total_donations'],
            'completed' => (int) $donations['completed_donations']
        ],

        'blood_requests' => [
            'total' => (int) $requests['total_requests'],
            'completed' => (int) $requests['completed_requests']
        ]
    ]
);