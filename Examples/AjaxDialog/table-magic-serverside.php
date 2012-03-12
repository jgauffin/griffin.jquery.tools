<?php 

if (isset($_POST['action']) { 
    $action = $_POST['action'];

    if ($action == 'fail') {
        $response = array(
            'success' => false, 
            body => 'Failed to complete operation'
        );
    }
    else if ($action == 'add' || $action == 'edit') {
        $response = array(
            'success' => true, 
            body => array(
                'contentType' => 'string', 
                'action' => $action, 
                'content' => array(
                    'id' => 4,
                    'name' => 'Arne K',
                    'age' => 21
                )
            )
        );
    }

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

    die();
} ?>

<form method="post" action="table-magic-serverside.php?gotTarget=<?php echo $_REQUEST['action'] ?>">
    <?php if ($_REQUEST['summary'] == 'true') { ?>
        <div class="validation-summary-valid" data-valmsg-summary="true">
            <span>Please fix these errors.</span>
            <ul><li style="display:none"></li></ul>
        </div>    
    <?php } ?>
    Name:
    <input type="text" value="" name="name" class="required" /><br />
    Age:
    <input type="text" value="" name="age" class="required" /><br />
    
    <input type="submit" value="POST">
</form>