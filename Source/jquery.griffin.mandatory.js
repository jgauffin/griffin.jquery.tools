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
    "use strict";
    return Object.prototype.toString.call(obj) === '[object Array]';
}
function isNonEmptyArrayLike(obj) {
    "use strict";
    try { // don't bother with `typeof` - just access `length` and `catch`
        return obj.length > 0 && '0' in Object(obj);
    }
    catch(e) {
        return false;
    }
}

/**
var response = {
    success: true, // or false
    contentType: 'model' // or 'dialog' etc
    body: {  // contentType specific
        action: 'show',
        content: ''
    }
*/

$.griffin.jsonResponse = function ($target, json) {
    "use strict";
    if (typeof $target === 'undefined') {
        throw '$target was not specified';
    }
    console.log(json.body);
    if (typeof json.success === 'undefined' || typeof json.body === 'undefined' || typeof json.contentType === 'undefined') {
        console.log(json);
        throw 'Expected to get the { success: true/false, contentType: "theType", body: {} } JSON respone';
    }

    if (!json.success) {
        $.griffin.dialogs.alert(json.body);
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
            // body = modelName, model, actionName
            PubSub.publish('griffin.model.' + data.body.modelName + '.load', data.body);
            return this;
        }
        else if (data.action === 'delete') {
            $target.remove();
            return this;
        }
        else if (typeof data.contentType !== 'undefined' && (data.contentType === 'html' || data.contentType === 'string')) {
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