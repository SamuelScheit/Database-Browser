<?php

$config = json_decode(file_get_contents("config.json"), true);
// var_dump($config);
$server = $config["server"];
$user = $config["user"];
$password = $config["password"];

if (isset($_GET['config'])) {
    switch ($_GET['config']) {
        case 'cred':
        var_dump($_GET);
            if (isset($_GET['server'])) {
                $config["server"] = $_GET['server'];
            } if (isset($_GET['user'])) {
                $config["user"] = $_GET['user'];
            } if (isset($_GET['password'])) {
                $config["password"] = $_GET['password'];
            }
            file_put_contents("config.json",json_encode($config));
            break;
        default:
            break;
    }
}

if (isset($_GET['sql'])) {
    $conn = new mysqli($server, $user, $password);

    if ($conn->connect_error) {
        exit("Connection failed: " . $conn->connect_error);
    }
    
    if (isset($_GET['db'])) {
        $conn->query("USE ".$_GET['db']);
    }

    if (isset($_GET['multi'])) {
        $result = $conn->multi_query($_GET['sql']);

        do {
            // Store first result set
            if ($result=$conn->store_result()) {
                    // Fetch one and one row
                while ($row=$result->fetch_row()) {
                    var_dump($row);
                }
                // Free result set
                $result->free();
            }
        } while ($conn->next_result());

    } else {
        $result = $conn->query($_GET['sql']);
        
        $data = array();

        if (!empty($conn->error)) {
            exit($conn->error);
        }

        if (is_object($result) == 0) {
            exit("[]");
            if ($result->num_rows > 0) {
                exit("no result");
            }
        }

        $i = 0;
        while($row = $result->fetch_assoc()) {
            $data[$i] = $row;
            $i++;
        }


        echo json_encode($data);
    }
}
// UPDATE users SET name = 'samuel.scheit@e.com' WHERE users.id = 1;
?>