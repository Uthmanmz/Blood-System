<?php

/*
 * Committed defaults. Real credentials belong in mail.local.php,
 * which is git-ignored, so they never reach version control.
 */

$config = [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'username' => '',
    'password' => '',
    'encryption' => 'tls',
    'from_email' => '',
    'from_name' => 'Evoltra Blood Network',
];

$localFile = __DIR__ . '/mail.local.php';

if (is_file($localFile)) {
    $config = array_merge($config, require $localFile);
}

return $config;
