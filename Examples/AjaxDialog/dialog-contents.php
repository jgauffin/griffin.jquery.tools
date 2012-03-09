<form method="post" action="dialog-form-post.php?gotTarget=<?php echo $_REQUEST['gotTarget'] ?>&fail=<?php echo $_REQUEST['fail'] ?>">
    <?php if ($_REQUEST['summary'] == 'true') { ?>
        <div class="validation-summary-valid" data-valmsg-summary="true">
            <span>Please fix these errors.</span>
            <ul><li style="display:none"></li></ul>
        </div>    
    <?php } ?>
    Some value:
    <input type="text" value="" name="contents" class="required" /><br />
    
    <input type="submit" value="POST">
</form>