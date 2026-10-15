<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Only POST requests are allowed', [], 405);
}

$data = getJsonInput();

$missing = requiredFields($data, [
    'full_name',
    'subject',
    'message'
]);

if (!empty($missing)) {
    jsonResponse(
        false,
        'Name, subject and message are required',
        ['missing_fields' => $missing],
        400
    );
}

$fullName = trim($data['full_name']);
$subject = trim($data['subject']);
$message = trim($data['message']);

$email = isset($data['email'])
    ? trim($data['email'])
    : null;

$phone = isset($data['phone'])
    ? trim($data['phone'])
    : null;

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'Invalid email address', [], 400);
}

$database = new Database();
$pdo = $database->connect();

$stmt = $pdo->prepare("
    INSERT INTO feedback (
        full_name,
        email,
        phone,
        subject,
        message,
        status
    )
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        'New'
    )
");

$stmt->execute([
    $fullName,
    $email ?: null,
    $phone ?: null,
    $subject,
    $message
]);

jsonResponse(
    true,
    'Feedback submitted successfully',
    [
        'feedback_id' => (int) $pdo->lastInsertId(),
        'status' => 'New'
    ],
    201
);