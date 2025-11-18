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
    public static function date(array $data, array $fields, string $format = 'Y-m-d'): void
    {
        $today = new DateTime('today');

        foreach ($fields as $field) {
            $value = (string)$data[$field];
            $dt = DateTime::createFromFormat($format, $value);
            $errors = DateTime::getLastErrors();

            // valid date
            if (!$dt || $errors['warning_count'] > 0 || $errors['error_count'] > 0) {
                throw new InvalidArgumentException("Field {$field} must be a valid date ({$format}).");
            }

            // date cannot be later than today
            if ($dt > $today) {
                throw new InvalidArgumentException("Field {$field} cannot be later than today ({$today->format($format)}).");
            }
        }
    }
}
