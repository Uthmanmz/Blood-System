<?php

function getJsonInput(): array
{
    $rawData = file_get_contents("php://input");

    if (empty($rawData)) {
        return [];
    }

    $data = json_decode($rawData, true);

    return is_array($data) ? $data : [];
}

function requiredFields(array $data, array $fields): array
{
    $missing = [];

    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            $missing[] = $field;
        }
    }

    return $missing;
}