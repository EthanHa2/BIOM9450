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
        $today = new DateTime('today');

        foreach ($fields as $field) {
            $value = (string)$data[$field];
            $dt = DateTime::createFromFormat($format, $value);
            $errors = DateTime::getLastErrors();

            // valid date
            if (!$dt) {
                throw new InvalidArgumentException("Field {$field} must be a valid date ({$format}).");
            }

            if (is_array($errors) && ($errors['warning_count'] > 0 || $errors['error_count'] > 0)) {
                throw new InvalidArgumentException("Field {$field} must be a valid date ({$format}).");
            }

            // date cannot be later than today
            if ($requirePast === True && $dt > $today) {
                throw new InvalidArgumentException("Field {$field} cannot be later than today ({$today->format($format)}).");
            }
        }
    }

    // local file path
    public static function path(array $data, array $fields, string $baseDir): void
    {
        foreach ($fields as $field) {
            $value = (string)$data[$field];

            $real = realpath($baseDir . DIRECTORY_SEPARATOR . $value);
            if ($real === false || strncmp($real, $baseDir, strlen($baseDir)) !== 0) {
                throw new InvalidArgumentException("File for field {$field} does not exist or is invalid.");
            }
        }
    }
}
