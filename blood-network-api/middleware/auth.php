<?php
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function requireAuth(): array
{
    if (
        !isset($_SESSION['user_id']) ||
        !isset($_SESSION['role'])
    ) {
        jsonResponse(
            false,
            'Authentication required',
            [],
            401
        );
    }

    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT
            id,
            hospital_id,
            full_name,
            email,
            role,
            account_status
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([
        $_SESSION['user_id']
    ]);

    $user = $stmt->fetch();

    if (!$user) {
        session_unset();
        session_destroy();

        jsonResponse(
            false,
            'User account no longer exists',
            [],
            401
        );
    }

    if ($user['account_status'] !== 'Active') {
        session_unset();
        session_destroy();

        jsonResponse(
            false,
            'Your account is not active',
            [],
            403
        );
    }

    /*
     * Refresh important session values from the database.
     * Do not trust old session data forever.
     */
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['hospital_id'] =
        $user['hospital_id'] !== null
            ? (int) $user['hospital_id']
            : null;

    return $user;
}