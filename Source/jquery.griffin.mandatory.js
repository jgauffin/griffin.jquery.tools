/** Must always be included for the other plugins to work
 * 
 */
 
 
 
 /** New loading event
  *
  * The following event is used to load plugins for a partial (HTML loaded through ajax)
  * or a full page.  The list will be clean once executed so that each method should only
  * be triggered one (when the document is loaded or when the HTML was loaded through ajax)
  *
  * You need to trigger it in the bottom of each page that is loaded through ajax like this:
  * $.triggerLoaded();
  *
  * Useage:
  *
  * Use it instead of $(document).ready();
  *
  * $.loaded(function(parent) {
  *     // Use the 'parent' variable to only search
  *     // the loaded part.
  *     $('.tabs', parent).tabs();
  * });
  *
  *
  */
  
$.loadedMethods = [];
$.loaded = function (func) {
    "use strict";
    
    $.loadedMethods.push(func);
};

$.triggerLoaded = function (parent) {
    "use strict";
    
    $.each($.loadedMethods, function (index, func) {
        func.apply(parent);
    });
    if (jQuery().validator) {
        jQuery.validator.unobtrusive.parse($(parent));
    }
    $.loadedMethods = [];
};

$(function() {
    "use strict";
    
    $.triggerLoaded($('body')[0]);
});

$.griffin = {};

function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};
function isNonEmptyArrayLike(obj) {
    try { // don't bother with `typeof` - just access `length` and `catch`
        return obj.length > 0 && '0' in Object(obj);
    }
    catch(e) {
        return false;
    }
};

/**
var response = {
    success: true, // or false
    responseType: 'model' // or 'dialog' etc
    body: {  // responseType specific
        action: 'show',
        content: ''
    }
*/

$.griffin.dialogs = [];
$.griffin.dialogs.alert = function(title, message) {
    var content = message;
    try {
        content = $(message);
    } catch (errMsg) {
        content = $('<div>' + message + '</div>');
    }
        
    var $dialog = $(content).appendTo($('body'));
    $dialog.dialog({ 
        dialogClass: 'griffin-dialog griffin-dialog-alert',
        title: title,
        modal: true, 
        width: 'auto', 
        buttons: {
            Ok: function() {
                $( this ).dialog( "close" );
                $dialog.remove();
            }
        }               
    });
};
$.griffin.dialogs.confirm = function(title, message, yesCallBack) {
    var content = message;
    try {
        content = $(message);
    } catch (errMsg) {
        content = $('<div>' + message + '</div>');
    }
        
    var $dialog = $(content).appendTo($('body'));
    $dialog.dialog({ 
        dialogClass: 'griffin-dialog griffin-dialog-confirm',
        title: title,
        modal: true, 
        width: 'auto', 
        buttons: {
            Yes: function() {
                $( this ).dialog( "close" );
                $dialog.remove();
                yesCallback();
            },
            No: function() {
                $( this ).dialog( "close" );
                $dialog.remove();
            }
        }               
    });
};

$.griffin.jsonResponse = function ($target, json) {
    "use strict";
    if (typeof $target === 'undefined') {
        throw '$target was not specified';
    }
    console.log(json.body);
    if (typeof json.success === 'undefined' || typeof json.body === 'undefined' || typeof json.responseType === 'undefined') {
        console.log(json);
        throw 'Expected to get the { success: true/false, responseType: "theType", body: {} } JSON respone';
    }

    if (!json.success) {
        alert(json.body);
        return this;
    }
    
    var args = {
        handled: false,
        response: json
    };
    PubSub.publish('griffin.json-response', args);
    
    var data = json.body;
    if (!args.handled) {
        if (data.action === 'model') {
            switch (data.body.action) {
                case 'update':
                    $.griffin.model.update(data.body.modelName, data.body.model);
                    break;
                case 'add':
                    $.griffin.model.update(data.body.modelName, data.body.model);
                    break;
                case 'delete':
                    $.griffin.model.update(data.body.modelName, data.body.id);
                    break;
            }
        }
        else if (data.action === 'delete') {
            $target.remove();
            return this;
        }
        else if (typeof data.contentType !== 'undefined' && (data.contentType === 'html' || data.contentType == 'string')) {
            if (data.action === 'replace') {
                $target.html(data.content);
                return this;
            } else if (data.action === 'add') {
                $target.append(data.content);
                return this;
            } 
        } else if (data.action === 'dialog') {
            $.griffin.dialogs.alert('Success', data.content);
            return this;
        }
    }
};