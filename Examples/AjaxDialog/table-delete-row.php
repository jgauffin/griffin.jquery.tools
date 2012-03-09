<?php
$response = array(
    'success' => true, 
    body => array(
        'action' => 'remove', 
    )
);

header('Content-type: application/json');
echo json_encode($response);

?>