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
    $.loadedMethods.push(func);
};

$.triggerLoaded = function (parent) {
    $.each($.loadedMethods, function (index, func) {
        func.apply(parent);
    });
    jQuery.validator.unobtrusive.parse($(parent));
    $.loadedMethods = [];
};

$(function() {
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

$.griffin.jsonResponse = function ($targetElement, json) {
    if (typeof json.Success === 'undefined' || typeof json.Content === 'undefined') {
        throw 'Expected to get the { success: true/false, action: "add/replace/edit/dialog", content: {} } JSON respone';
    }

    if (!json.success) {
        alert(json.content);
        return this;
    }
    
    var args = {
        handled: false,
        content: json.content
    };
    $targetElement.trigger('json-' + json.action, args);
    
    if (!args.handled) {
        if (json.Action === 'delete') {
            $targetElement.remove();
            return this;
        }
        else if (typeof json.ContentType !== 'undefined' && json.ContentType === 'text/html') {
            if (json.Action === 'replace') {
                $target.html(json.Content);
                return this;
            } else if (json.Action === 'add') {
                $target.append(json.Content);
                return this;
            } else if (json.Action === 'dialog') {
                
            }
        }
        
        switch ($targetElement[0].nodeName.toLowerCase()) {
            case 'select':
                if (json.Action == 'add') {
                    
                    if (typeof data.Content !== 'array') {
                        data.Content = [data.Content];
                    }
                    
                    $.each(data.Content, function(index, item) {
                        var option='<option value="' + item.Value + "'>" + item.Label + '</option>';
                        $targetElement.parent().append(option);
                        if (typeof item.Selected  !== 'undefined' && item.Selected) {
                            option.attr('selected', 'selected');
                        }
                    });
                }
                break;
            case 'option';
                $targetElement.attr('value', data.Content.Value);
                $targetElement.html(data.Content.Label);
                if (typeof data.Content.Selected  !== 'undefined' && data.Content.Selected) {
                    $targetElement.attr('selected', 'selected');
                } else {
                    $targetElement.removeAttr('selected');
                }
                break;       
            case 'table':
                if (json.Action == 'add') {
                    if (typeof data.Content !== 'array') {
                        data.Content = [data.Content];
                    }
                    
                    $.each(data.Content, function(index, item) {
                        var option='<option value="' + item.Value + "'>" + item.Label + '</option>';
                        $targetElement.parent().append(option);
                        if (typeof item.Selected  !== 'undefined' && item.Selected) {
                            option.attr('selected', 'selected');
                        }
                    });
                }                
        }
    
    }
});