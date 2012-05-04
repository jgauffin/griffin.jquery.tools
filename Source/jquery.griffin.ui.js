/** UI helpers
 * Helper methods for jQueryUI which makes it easier to work with the different controls.
 *
 */

$.griffin.ui = { dialogs: {},  helpers: {}};
$.griffin.ui.dialogs.text = {
    ok: 'OK',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    notitle: 'Untitled'
};

$.griffin.ui.helpers.fixContent = function(message) {
    var content = message;
    try {
        if (message.indexOf('<') === -1 && message.substr(0, 1) !== '#') {
            content = $('<div>' + message + '</div>');
        } else {
            content = $(message);
        }
    } catch (errMsg) {
        content = $('<div>' + message + '</div>');
    }
    return content;
};

/* options: title, message, closed (callback)
 */
$.griffin.ui.dialogs.alert = function(options) {
    "use strict";
    
    var defaults = { 
        closed: function() {},
        dialogClass: 'griffin-dialog griffin-dialog-alert',
        title: $.griffin.ui.dialogs.text.notitle,
        modal: true, 
        width: 'auto', 
        buttons: [
            {
                text: $.griffin.ui.dialogs.text.ok,
                click: function() {
                    $( this ).dialog( "close" );
                    $dialog.remove();
                    options.closed();
                }
            }
        ]
    };
    options = $.extend(defaults, options, true);
    var content = $.griffin.ui.helpers.fixContent(options.message);
    var $dialog = $(content).appendTo($('body'));
    $dialog.dialog(options).show();
};

/**
 * options: title, message, yes (callback), no (callback)
 */
$.griffin.ui.dialogs.confirm = function(options) {
    "use strict";
    var defaults = { 
        dialogClass: 'griffin-dialog griffin-dialog-confirm',
        title: $.griffin.ui.dialogs.text.notitle,
        modal: true, 
        width: 'auto', 
        buttons: [
            {
                text: $.griffin.ui.dialogs.text.yes,
                click: function() {
                    $( this ).dialog( "close" );
                    $dialog.remove();
                    options.yes();
                }
            },
            {
                text: $.griffin.ui.dialogs.text.no,
                click: function() {
                    $( this ).dialog( "close" );
                    $dialog.remove();
                    options.no();
                }
            }
        ]          
    };
    options = $.extend(defaults, options, true);
     
    var content = $.griffin.ui.helpers.fixContent(options.message);
    var $dialog = $(content).appendTo($('body'));
    $dialog.dialog(options);
};
