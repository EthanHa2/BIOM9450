<?php

final class Validator
{
    private function __construct() {}

    // required
    public static function required(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }

            $value = $data[$field];
            if (is_string($value) && trim($value) === '') {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }
        }
    }

    // integer
    public static function int(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!is_numeric($data[$field])) {
                throw new InvalidArgumentException("Field {$field} must be numeric.");
            }
        }
    }


    // date
    public static function date(array $data, array $fields, string $format = 'Y-m-d', bool $requirePast = True): void
    {
        $timezone = new DateTimeZone('Australia/Sydney');
        $today = new DateTimeImmutable('today', $timezone);

        foreach ($fields as $field) {
            if (!isset($data[$field])) {
                throw new InvalidArgumentException("Missing required field: {$field}");
            }

            $value = (string)$data[$field];

            // parse with the exact same timezone
            $dt = DateTimeImmutable::createFromFormat($format, $value, $timezone);
            $errors = DateTimeImmutable::getLastErrors();

            // invalid format or warnings/errors
            if (!$dt || ($errors['error_count'] ?? 0) > 0 || ($errors['warning_count'] ?? 0) > 0) {
                throw new InvalidArgumentException("Field {$field} must be a valid date ({$format}).");
            }

            // normalise to 00:00
            $dt = $dt->setTime(0, 0, 0);

            // Date must not be in the future
            if ($requirePast && $dt > $today) {
                throw new InvalidArgumentException(
                    "Field {$field} cannot be later than today ({$today->format($format)})."
                );
            }
        }
    }

    // local file path
    public static function path(array $data, array $fields, string $baseDir): void
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || $data[$field] === null) {
                continue; // Skip validation if field is not present or null
            }
            $value = (string)$data[$field];

            // Construct path relative to document root if it starts with /
            $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
            if (strpos($value, '/') === 0 && !empty($docRoot)) {
                $checkPath = $docRoot . $value;
            } else {
                $checkPath = $baseDir . DIRECTORY_SEPARATOR . $value;
            }

            if (!file_exists($checkPath)) {
                throw new InvalidArgumentException("File for field {$field} does not exist or is invalid.");
            }
        }
    }
}
