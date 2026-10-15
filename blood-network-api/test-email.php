<?php

require_once __DIR__ . '/helpers/email.php';

$result = sendEmail(
    'usmanmustaphazakari@gmail.com',
    'Usman',
    'Evoltra Blood Network Email Test',
    'This is a test email from the Evoltra Blood Network backend.'
);

header('Content-Type: application/json');

echo json_encode(
    $result,
    JSON_PRETTY_PRINT
);