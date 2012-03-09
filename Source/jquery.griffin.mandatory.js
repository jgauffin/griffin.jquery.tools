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

/*
$.griffin.renderTemplate = function($target, template) {
    var internalRenderer = function() {};
    
    var templateNode = $('#' + $target.attr('id') + '-template');
    if (templateNode.length === 0) {
        switch ($target[0].nodeName.toLowerCase()) {
            case 'option': 
                $templateNode = this.getOrCreate('option-template', '<option value="{{=Option}}" {{=Selected}}>{{=Label}}</option>');
                break;
            case 'td': 
                $templateNode = this.getOrCreate('td-template', '<td>{{=Content}}</td>');
                break;
            case 'td': 
                $templateNode = this.getOrCreate('td-template', '<td>{{=Content}}</td>');
                break;
        }
    }
    else if (templateNode.length === 1) {
        $target.data('griffin-template', templateNode);

        if (jQuery().render) {
            $target.data('griffin-template', this.renderRowUsingJsRender);
        } else if (jQuery().tmpl) {
            $.template("rowTemplate", templateNode); //outerhtml: .clone().wrap('<div></div>').parent().html()
            $target.data('griffin-template', this.renderRowUsingTmpl);
        } else {
            alert('You have defined a template but either jsRender or jquery.tmpl could be found. Forgot to include a script?');
        }

        // exit either way
        return true;
    }

        $table.data('row-renderer', this.renderRowUsingVanilla);
        return true;
    },

    renderRow: function ($table, columns, row) {
        return $table.data('row-renderer')($table, columns, row);
    },

    renderRowUsingJsRender: function ($table, columns, row) {
        return $($($table.data('row-template')).render(row));
    },

    renderRowUsingTmpl: function ($table, columns, row) {
        if (typeof row !== 'object') {
            row = toObject(row);
        }

        return $.tmpl("rowTemplate", row);
    },

    renderRowUsingVanilla: function ($table, columns, row) {
        var fetchColumnValue = function (row, index) {
            return row[index];
        };
        if (!(row instanceof Array)) {
            fetchColumnValue = function (row, index) {
                return row[columns[index].name];
            };
        }

        var $row = $('<tr></tr>');
        $.each(columns, function (columnIndex, column) {
            
            var $cell = $('<td></td>');
            if (column.hidden) {
                $cell.css('display', 'none');
            }
            $cell.html(fetchColumnValue(row, columnIndex));
            $cell.appendTo($row);
        });

        return $row;
    }
};
*/


/**
var reponse = {
    success: true, // or false
    body: { 
        action: 'dialog', // or 'add', 'replace', 'delete'
        contentType: 'html', //or 'json'
        content: // described below if content type is not HTML
    }
    
    Contents
    *********

        action = 'dialog':  'a string'
        table:              [['cell content', 'cell content'], ['cell content', 'cell content']]   (one main array for rows and one array per column in a row)
        option:             { value: 'str', label: 'title' }
        select:             [{ value: 'str', label: 'title' }, { value: 'str', label: 'title' }] (array of options)
        input[type=checkbox] { checked: true, value: '1' }
        input[type=radio]   { checked: true, value: '1' }
        input[type=text]    { value: 'some text' }
        input[type=hidden]  { value: 'some text' }
        
        

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
    if (typeof json.success === 'undefined' || typeof json.body === 'undefined') {
        console.log(json);
        throw 'Expected to get the { success: true/false, body: {} } JSON respone';
    }

    if (!json.success) {
        alert(json.content);
        return this;
    }
    
    var args = {
        handled: false,
        content: json.content
    };
    $target.trigger('json-' + json.action, args);
    
    var data = json.body;
    if (!args.handled) {
        if (data.action === 'delete') {
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
        
        switch ($target[0].nodeName.toLowerCase()) {
            case 'select':
                if (data.action === 'add') {
                    
                    if (typeof data.content !== 'array') {
                        data.content = [data.content];
                    }
                    
                    $.each(data.content, function(index, item) {
                        var option='<option value="' + item.Value + "'>" + item.Label + '</option>';
                        $target.parent().append(option);
                        if (typeof item.Selected  !== 'undefined' && item.Selected) {
                            option.attr('selected', 'selected');
                        }
                    });
                }
                break;
            case 'option':
                $target.attr('value', data.content.Value);
                $target.html(data.content.Label);
                if (typeof data.content.Selected  !== 'undefined' && data.content.Selected) {
                    $target.attr('selected', 'selected');
                } else {
                    $target.removeAttr('selected');
                }
                break;       
            case 'table':
                if (data.action === 'add') {
                    if (typeof data.content !== 'array') {
                        data.content = [data.content];
                    }
                    
                    $.each(data.content, function(index, item) {
                        var option='<option value="' + item.Value + "'>" + item.Label + '</option>';
                        $target.parent().append(option);
                        if (typeof item.Selected  !== 'undefined' && item.Selected) {
                            option.attr('selected', 'selected');
                        }
                    });
                }                
        }
    
    }
};