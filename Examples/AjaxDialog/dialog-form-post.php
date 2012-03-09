<?php
$response = array(
    'success' => true, 
    body => array(
        'contentType' => 'string', 
        'action' => 'dialog', 
        'content' => 'Your form have been updated'
    )
);

if ($_REQUEST['gotTarget'] == 'true') {
    $response['body']['action']= 'replace';
    //die('done');
}
if ($_REQUEST['fail'] == 'true') {
    $response['success'] = false;
    $response['body'] = 'Ooops. Something went wrong ;(';
    //die('done');
}

header('Content-type: application/json');
echo json_encode($response);

?>