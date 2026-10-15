<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';

requireAuth();
requireRole(['donor']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(
        false,
        'Only POST requests are allowed',
        [],
        405
    );
}

$data = getJsonInput();

if (!array_key_exists('available_for_donation', $data)) {
    jsonResponse(
        false,
        'Availability value is required',
        [],
        400
    );
}

$available = filter_var(
    $data['available_for_donation'],
    FILTER_VALIDATE_BOOLEAN,
    FILTER_NULL_ON_FAILURE
);

if ($available === null) {
    jsonResponse(
        false,
        'Invalid availability value',
        [],
        400
    );
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    UPDATE donor_profiles
    SET available_for_donation = ?
    WHERE user_id = ?
");

$stmt->execute([
    $available ? 1 : 0,
    $_SESSION['user_id']
]);

jsonResponse(
    true,
    'Donation availability updated successfully',
    [
        'available_for_donation' => $available
    ]
);