<?php
// Replace these values with your database information

header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('log_errors', 1);

$host = 'localhost';
$dbname = 'collect_results';
$user = 'root';
$pass = '';

// Set up the DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname";

// Set up options for PDO (PHP Data Objects)
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// Attempt to establish a connection to the database
try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If there is an error, return a JSON response with the error message
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}

// Collect and decode the JSON POST data from the JavaScript application
$data = json_decode(file_get_contents('php://input'), true);

// Prepare the SQL statement to insert user answers
$stmt = $pdo->prepare("INSERT INTO answers (question_id, answer) VALUES (:question_id, :answer)");

// Begin a transaction to ensure all answers are inserted
$pdo->beginTransaction();

// Attempt to insert each answer into the database
try {
    foreach ($data['answers'] as $item) {
        $stmt->execute([
            ':question_id' => $item['id'],
            ':answer' => $item['answer']
        ]);
    }
    // Commit the transaction
    $pdo->commit();

    // Return a JSON response indicating success
    echo json_encode(['status' => 'success', 'message' => 'Answers submitted successfully']);
} catch (\PDOException $e) {
    // If there is an error during insertion, roll back the transaction and return an error message
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>