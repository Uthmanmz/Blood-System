<?php

function normalizeNigerianPhone(string $phone): string
{
    // Remove spaces, brackets, hyphens, etc.
    $phone = preg_replace('/[^0-9+]/', '', $phone);

    // +2348012345678 -> 2348012345678
    if (str_starts_with($phone, '+234')) {
        return substr($phone, 1);
    }

    // 08012345678 -> 2348012345678
    if (str_starts_with($phone, '0')) {
        return '234' . substr($phone, 1);
    }

    return $phone;
}


function sendSMS(
    string $phone,
    string $message
): array {

    $config = require __DIR__ . '/../config/sms.php';

    /*
     * We have deliberately not configured the real token yet.
     * Do not attempt sending until it exists.
     */
    if (empty($config['api_token'])) {
        return [
            'success' => false,
            'configured' => false,
            'message' => 'BulkSMSNigeria API token is not configured'
        ];
    }

    $phone = normalizeNigerianPhone($phone);

    $baseUrl = $config['use_sandbox']
        ? $config['sandbox_url']
        : $config['base_url'];

    $url = rtrim($baseUrl, '/') . '/sms';

    $payload = [
        'from' => $config['sender_id'],
        'to' => $phone,
        'body' => $message,
        'gateway' => $config['gateway']
    ];

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),

        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['api_token'],
            'Content-Type: application/json',
            'Accept: application/json'
        ],

        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);

    $httpCode = curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    $curlError = curl_error($ch);

    curl_close($ch);


    if ($curlError) {
        return [
            'success' => false,
            'configured' => true,
            'message' => $curlError
        ];
    }


    $result = json_decode(
        $response,
        true
    );


    if (
        $httpCode >= 200 &&
        $httpCode < 300 &&
        isset($result['status']) &&
        $result['status'] === 'success'
    ) {
        return [
            'success' => true,
            'configured' => true,
            'message' => $result['message'] ?? 'SMS sent successfully',
            'data' => $result['data'] ?? null
        ];
    }


    return [
        'success' => false,
        'configured' => true,
        'message' =>
            $result['message']
            ?? 'SMS sending failed',
        'response' => $result
    ];
}