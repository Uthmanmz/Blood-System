<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../helpers/response.php';

if (!isset($_SESSION['user_id'])) {
    jsonResponse(
        false,
        'Not authenticated',
        [],
        401
    );
}

jsonResponse(
    true,
    'Authenticated user found',
    [
        'user' => [
            'id' => $_SESSION['user_id'],
            'role' => $_SESSION['role'],
            'hospital_id' => $_SESSION['hospital_id']
        ]
    ]
);