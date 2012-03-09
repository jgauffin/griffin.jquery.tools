/** Ajax dialog
 * Loads the link through ajax and uses the result in a jQueryUI dialog.
 * Posts the content form (if any) through ajax and checks the specified result
 *
 * The link can contain a "rel" attribute to indicate that the POST form result
 * should target a specific node.
 *
 * Usage (expects HTML back):
 *
 * <a href="/user/create" rel="#myTable" class="ajax-dialog">Create user</a>
 *
 * You can also convert forms into ajax forms (expects JSON back):
 *
 * <form method="POST" action="/user/create" class="ajax-form" rel="#mySelectList">
 * </form>
 * 
 * Expected JSON response
 * 
 * {
 *      success: true,
 *      action: append/delete/replace,
 *
 *      content: {
 *          action: append/delete/replace,
 *      }
 * }
 *
 * The content depends on the target.
 *
 * 
 * 
 */
(function($) {
    "use strict";
    
    $.griffin = $.extend({
        dialog: {
            globals: {
                texts: {
                    title: 'Please wait, loading..'
                },
                translations: []
            }
        }
    }, $.griffin, true);

    var methods = {
        init: function(options) {
            var settings = $.extend({
                /** Can be a #id or a string */
                container: '<div class="dialog-container"></div>',
                
                // null == use link title
                title: null
            }, options, true);

            return this.each(function() {
                var $this = $(this);
                var self = this;
                var data = $this.data('griffin-ajax-dialog');
                

                this.transformForm = function($form, $target, callback) {

                    // validation supported and it failed
                    if (jQuery().validate && !$form.valid()) {
                        return;
                    }
                    
                    var container = $($form).find("[data-valmsg-summary=true]");
                    if (container.length !== 0) {
                        container.addClass('validation-summary-valid');
                        container.removeClass('validation-summary-errors');
                        $('li', container).remove();
                    }
                    
                    $.ajax($form.attr('action'), {
                        type: $form.attr('method'),
                        data: $form.serialize(),
                        success: function (data) {
                            if (!data.success) {
                                var container = $($form).find("[data-valmsg-summary=true]");
                                if (container.length !== 0) {
                                    container.removeClass('validation-summary-valid');
                                    container.addClass('validation-summary-errors');
                                    $('ul', container).append('<li>' + data.body + '</li>');
                                } else {
                                    $.griffin.dialogs.alert('Failure', data.body);
                                }
                            }
                            else {
                                $.griffin.jsonResponse($target, data);
                                callback();
                            }
                        }
                    });                
                };
                
                this.initializeForm = function(contents) {
                    data.dialog.html(contents);
                    $.triggerLoaded(data.dialog[0]);

                    var $buttons = $('input[type="submit"], input[type="button"]', data.dialog).hide();
                    var options= {
                        title: $this.html(),
                        modal: true,
                        width: 'auto',
                        buttons: [],
                        closed: function() {
                            if (data.removeWhenDone) {
                                data.dialog.remove();
                            }
                        }
                    };
                    
                    $buttons.each(function () {
                        if ($(this).attr('type') === 'submit') {
                            options.buttons.push({
                                text: $(this).val(),
                                click: function () {
                                    var $form = $('form', data.dialog);
                                    if ($form.length === 1) {
                                        self.transformForm($form, data.target, function() { data.dialog.dialog('close'); });
                                    }
                                    
                                }
                            });
                        } else {
                            options.buttons.push({
                                text: $(this).val(),
                                click: function () {
                                    data.dialog.dialog('close');
                                }
                            });                                
                        }
                    });
                    
                    data.dialog.dialog(options);
                };
                
                if (typeof data === 'undefined') {
                    if ($this.hasClass('delete')) {
                        $this.click(function (e) {
                            e.preventDefault();
                            $.griffin.dialogs.confirm('Delete item', 'Do you really want to delete the selected item?', function() {
                                $.post($this.attr('href'), function(data) {
                                    $.griffin.jsonResponse($target, data);
                                });
                            });
                        });
                        return this;
                    }
                    
                    data = { removeWhenDone: false };
                    
                    data.target = $('#' + $this.attr('rel'));
                    $this.click(function (e) {
                        e.preventDefault();

                        var overlay = { elementOverlay: function(){} };
                        if (jQuery().elementOverlay) {
                             overlay = $(this).elementOverlay();
                         };
                        $.get($(this).attr('href'), function (dialogContents) {
                            overlay.elementOverlay('destroy');
                            
                            data.dialog = $(settings.container);
                            if (settings.container.substr(0, 1) !== '#') {
                                data.dialog.appendTo('body');
                                data.removeWhenDone  = true;
                            }
                            
                            self.initializeForm(dialogContents);
                        });
                    });                    
                }
                
                return this;
            });
        },
        destroy: function( ) {

            return this.each(function() {

                var $this = $(this),
                    data = $this.data('overlay');

                // Namespacing FTW
                $(window).unbind('.elementOverlay');
                data.overlay.remove();
                $this.removeData('overlay');

            });
        },
        
        show: function( ) {
            var $this = $(this),
                data = $this.data('overlay');

            data.target2.reposition();
            data.overlay.show();
            return this;
        },
        hide: function( ) {
            var $this = $(this),
                data = $this.data('overlay');

            data.overlay.hide();
            return this;
        }
    };

    $.fn.griffinDialog = function(method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.griffinDialog');
        }

    };

})(jQuery);

if (typeof $.loaded !== 'undefined') {
    $.loaded(function(parent) {
        "use strict";
        $('a.ajax-dialog', parent).griffinDialog();
    });
}