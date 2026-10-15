<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../helpers/response.php';

function requireRole(array $allowedRoles): void
{
    if (!isset($_SESSION['role'])) {
        jsonResponse(
            false,
            'Authentication required',
            [],
            401
        );
    }

    if (!in_array($_SESSION['role'], $allowedRoles, true)) {
        jsonResponse(
            false,
            'You are not allowed to perform this action',
            [],
            403
        );
    }
}