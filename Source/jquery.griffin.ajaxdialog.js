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
 * Expects one of the defined griffin.jquery defined JSON responses.
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
                title: null,
                
                success: null /*function(response) {}*/
            }, options, true);

            return this.each(function() {
                var $this = $(this);
                var self = this;
                var data = $this.data('griffin-ajax-dialog');
                
                this.handleResponse = function($form, response, success) {
                    if (!response.success) {
                        var container = $($form).find("[data-valmsg-summary=true]");
                        if (response.contentType === 'model-errors') {
                            var str = '<dl>';
                            $.each(response.body, function(name, errors) {
                                str += '<dt>' + name + '</dt><dd><ul>';
                                $.each(errors, function(index, error) {
                                    str += '<li>' + error + '</li>\n';
                                });
                                str += '</ul></dd>';
                            });
                            str += '</dl>';
                            $.griffin.ui.dialogs.alert({ title: 'Validation error!', message: str});
                            return;
                        } else if (response.contentType === 'validation-rules') {
                            response.body.debug = true;
                            /*
                            response.body.invalidHandler = function(form, validator) {
                              var errors = validator.numberOfInvalids();
                              if (errors) {
                                var message = errors == 1
                                  ? 'You missed 1 field. It has been highlighted'
                                  : 'You missed ' + errors + ' fields. They have been highlighted';
                                $("div.error span").html(message);
                                $("div.error").show();
                              } else {
                                $("div.error").hide();
                              }
                            }
                            console.log(response.body);*/
                            $form.validate().showErrors();
                            $form.removeData("validator");
                            $form.validate(response.body).valid();
                            //$form.validate().showErrors();
                            
                        } else if (container.length !== 0) {
                            container.removeClass('validation-summary-valid');
                            container.addClass('validation-summary-errors');
                            $('ul', container).append('<li>' + response.body + '</li>');
                        } else {
                            $.griffin.ui.dialogs.alert({ title: 'Failure', message: response.body});
                        }
                    }
                    else {
                        success();
                    }
                };

                this.handleSubmit = function($form, $target, callback) {
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
                        success: function (response) {
                            self.handleResponse($form, response, function() {
                                callback();
                                if (data.options.success !== null) {
                                    data.options.success.apply(self, [response]);
                                } else {
                                    $.griffin.jsonResponse($form, response);
                                }
                            });
                        }
                    });                
                };
                
                this.initializeForm = function(contents) {
                    data.dialog.html(contents);
                    $.triggerLoaded(data.dialog[0]);

                    var $buttons = $('input[type="submit"], input[type="button"]', data.dialog).hide();
                    var dialogOptions = {
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
                    
                    var $form = $('form', data.dialog);
                    if ($form.length !== 1) {
                        throw 'There must only be one form in the contents that the dialog is generated for';
                    }
                    var target = data.target;
                    if (data.target.length === 0) {
                        target = $form;
                    }

                    $form.submit(function(e) {
                        e.preventDefault();
                        self.handleSubmit($form, target, function() { data.dialog.dialog('close'); });
                    });
                    if ($.validator && $.validator.unobtrusive) {
                        $form.removeData("validator");
                        $form.removeData("unobtrusiveValidation");
                        $.validator.unobtrusive.parse($form);
                    }

                    $buttons.each(function () {
                        if ($(this).attr('type') === 'submit') {
                            dialogOptions.buttons.push({
                                text: $(this).val(),
                                click: function () {
                                    $form.submit();
                                }
                            });
                        } else {
                            dialogOptions.buttons.push({
                                text: $(this).val(),
                                click: function () {
                                    data.dialog.dialog('close');
                                }
                            });                                
                        }
                    });
                    
                    data.dialog.dialog(dialogOptions);
                };
                
                if (typeof data === 'undefined') {
                    if ($this.hasClass('delete')) {
                        $this.click(function (e) {
                            e.preventDefault();
                            $.griffin.ui.dialogs.confirm({ title: 'Delete item', message: 'Do you really want to delete the selected item?', yes: function() {
                                $.post($this.attr('href'), function(data) {
                                    $.griffin.jsonResponse(data.target, data);
                                });
                            }});
                        });
                        return this;
                    }
                    
                    data = { removeWhenDone: false };
                    
                    data.target = $('#' + $this.attr('rel'));
                    data.options = settings;
                    $this.click(function (e) {
                        e.preventDefault();

                        var overlay = { elementOverlay: function(){} };
                        if (jQuery().elementOverlay) {
                             overlay = $(this).elementOverlay();
                         }
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

                    //self.handleResponse(null, { success: false, contentType: 'model-errors', body: { 'user': [ 'some error' ] }});
                }
                
                return this;
            });
        },
        destroy: function( ) {

            return this.each(function() {

                var $this = $(this),
                    data = $this.data('griffin-ajax-dialog');

                $(window).unbind('.griffin-ajax-dialog');
                data.overlay.remove();
                $this.removeData('griffin-ajax-dialog');

            });
        },
        
        show: function( ) {
            var $this = $(this),
                data = $this.data('griffin-ajax-dialog');

            data.target2.reposition();
            data.overlay.show();
            return this;
        },
        hide: function( ) {
            var $this = $(this),
                data = $this.data('griffin-ajax-dialog');

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