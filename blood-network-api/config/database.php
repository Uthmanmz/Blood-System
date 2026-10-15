<?php

class Database
{
    private $host = 'localhost';
    private $database = 'blood_network_db';
    private $username = 'root';
    private $password = '';

    public function connect()
    {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4";

            $pdo = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );

            return $pdo;

        } catch (PDOException $e) {

            echo "Database connection failed: " . $e->getMessage();
            exit;
        }
    }
}