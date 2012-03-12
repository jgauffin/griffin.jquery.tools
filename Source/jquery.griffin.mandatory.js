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


$.griffin.idAccessor = {
    get: function(item) { return item.id; },
    set: function(item, value) { item.id = value; }
}
$.griffin.renderItem = function($target, data) {
    var internalRenderer = function() {};

    var renderRowUsingJsRender = function ($target, row) {
        var template = $target.data('griffin-render-node');
        return $(template.render(row));
    },

    renderRowUsingTmpl = function ($target, row) {
        return $.tmpl("griffin-render-template", row);
    },
    
    initialize = function() {
        var templateNode = $('#' + $target.attr('id') + '-template');
        if (templateNode.length === 1) {
            $target.data('griffin-render-node', templateNode);

            if (jQuery().render) {
                $target.data('griffin-renderer', renderRowUsingJsRender);
            } else if (jQuery().tmpl) {
                $.template("griffin-render-template", templateNode); //outerhtml: .clone().wrap('<div></div>').parent().html()
                $target.data('griffin-renderer', renderRowUsingTmpl);
            } else {
                throw 'Failed to find on of the jQuery tmpl and jsRender template engines';
            }
            
            return this;
        } else {
            throw 'No template was found for ' + $target.attr('id');
        }
    };
    

    var renderer = $target.data('griffin-renderer');
    if (typeof renderer === 'undefined'){
        initialize();
        renderer = $target.data('griffin-renderer');
    }
    var item = renderer($target, data);
    item.attr('data-model-id', $.griffin.idAccessor.get(data));
    return item;    
};

$.griffin.model = {};
$.griffin.model.items = [],
$.griffin.model.update = function(modelName, data) {
    var updateItem = function($target, itemData) {
        var $existing = $('[data-model-id="' + $.griffin.idAccessor.get(itemData) + '"]', $target);
        if ($existing.length == 1) {
            
            $existing.replaceWith($.griffin.renderItem($target, itemData));
            PubSub.publish('griffin.node.' + modelName + '.added.' + $.griffin.idAccessor.get(data), { node: $existing[0], data: itemData, target: $target[0], modelName: modelName});
        } else {
            var node = $.griffin.renderItem($target, itemData).appendTo($target);
            PubSub.publish('griffin.node.' + modelName + '.updated.' + $.griffin.idAccessor.get(itemData), { node: node, data: itemData, target: $target[0], modelName: modelName });
        }    
    };
    
    $('[data-model-name="' + modelName + '"]').each(function() {
        var $this = $(this);
        if (!isArray(data)) {
            $.griffin.model.set(modelName, data);
            PubSub.publish('griffin.model.' + modelName + '.loading.' + $.griffin.idAccessor.get(data), { data: data, modelName: modelName });
            updateItem($this, data);
            PubSub.publish('griffin.model.' + modelName + '.loaded.' + $.griffin.idAccessor.get(data), { data: data, modelName: modelName });
        } else {
            $.each(data, function(index, item) {
                $.griffin.model.set(modelName, item);
                PubSub.publish('griffin.model.' + modelName + '.loading.' + $.griffin.idAccessor.get(item), { data: item, modelName: modelName });
                updateItem($this, item);
                PubSub.publish('griffin.model.' + modelName + '.loaded.' + $.griffin.idAccessor.get(item), { data: item, modelName: modelName });
            });
        }
    });
}

$.griffin.model.delete = function(modelName, id) {
    if (typeof $.griffin.model.items[modelName] === 'undefined')
        $.griffin.model.items[modelName] = [];

    if (typeof id !== 'number') {
        id = $.griffin.idAccessor.get(id);
    }
    
    var item = $.griffin.model.items[modelName][id];
    
    $('[data-model-name="' + modelName + '"]').each(function() {
        var $this = $(this);
        if (typeof $this.attr('data-model-id') === 'undefined') {
            $('[data-model-id="' + id + '"]', $this).each(function() {
                PubSub.publish('griffin.node.' + modelName + '.deleted.' + id, { node: this, data: item, target: $this[0], modelName: modelName});
                $(this).remove();
            });
        }
        else {
            $this.remove();
            PubSub.publish('griffin.node.' + modelName + '.deleted.' + id, { node: this, data: item, target: this, modelName: modelName});
        }
    });
    
    PubSub.publish('griffin.model.' + modelName + '.deleted.' + id, { data: item, modelName: modelName });
    delete $.griffin.model.items[modelName][id];
};

$.griffin.model.get = function(modelName, id) {
    if (typeof id === 'number') {
        return $.griffin.model.items[modelName][id];
    }
    
    return $.griffin.model.items[modelName][$.griffin.idAccessor.get(id)];
}

$.griffin.model.set = function(modelName, data) {
    if (typeof $.griffin.model.items[modelName] === 'undefined')
        $.griffin.model.items[modelName] = [];
        
     $.griffin.model.items[modelName][$.griffin.idAccessor.get(data)] = data;
}

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