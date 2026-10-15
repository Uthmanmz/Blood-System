<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/role.php';
require_once __DIR__ . '/../../middleware/permission.php';

requireAuth();
requireRole(['personnel']);

requirePermission('MANAGE_INVENTORY');

jsonResponse(
    true,
    'You are allowed to manage inventory',
    [
        'user_id' => (int) $_SESSION['user_id'],
        'hospital_id' => (int) $_SESSION['hospital_id']
    ]
);