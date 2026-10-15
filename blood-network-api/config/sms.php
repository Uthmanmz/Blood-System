<?php

/*
 * Committed defaults. Real credentials belong in sms.local.php,
 * which is git-ignored, so they never reach version control.
 */

$config = [
    'base_url' => 'https://www.bulksmsnigeria.com/api/v2',
    'sandbox_url' => 'https://www.bulksmsnigeria.com/api/sandbox/v2',
    'api_token' => '',
    'sender_id' => 'EVOLTRA',
    'gateway' => 'direct-refund',
    'use_sandbox' => true,
];

$localFile = __DIR__ . '/sms.local.php';

if (is_file($localFile)) {
    $config = array_merge($config, require $localFile);
}

return $config;
