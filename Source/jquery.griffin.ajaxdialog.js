/** Ajax dialog
 * 
 * Loads the link through ajax and uses the result in a jQueryUI dialog.
 * Posts the content form (if any) through ajax and checks the specified result
 *
 * The link can contain a "rel" attribute to indicate that the POST form result
 * should target a specific node.
 *
 * Usage:
 *
 * <a href="/user/create" rel="#myTable" class="ajax-dialog">Create user</a>
 *
 * You can also convert forms into ajax forms:
 *
 * <form method="POST" action="/user/create" class="ajax-form" rel="#mySelectList">
 * </form>
 * 
 * Expected JSON response
 * 
 * {
 *      success: true,
 *      content: {
 *          action: append/delete/replace
 *      }
 * }
 *
 * The content depends on the target.
 *
 * 
 * 
 */
(function($) {
    //globals
    $.elementOverlay = {
        texts: {
            title: 'Please wait, loading..'
        },
        translations: []
    };
    
    var methods = {
        init: function(options) {
            var settings = $.extend({
                /** Can be a #id or a sting */
                overlayContents: '<div class="ui-widget-overlay element-overlay-container" id="{{id}}"><div>{{contents}}</div></div>',
                
                title: $.elementOverlay.texts.title
            }, options, true);

            return this.each(function() {
                var $this = $(this);
                var self = this;
                var data = $this.data('griffin-ajax-dialog');
                

                this.reposition = function() {
                    var pos = $this.offset();
                    data.overlay.css({
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        width: $this.width() + "px",
                        height: $this.height() + "px"
                    });
                    $('div', data.overlay).css('padding-top', (($this.height() / 2) - 20) + 'px');
                };
                
                this.transformForm = function($form, $target) {
                    if (jQuery().validate && !$form.valid()) {
                        return;
                    }
                    $.ajax($form.attr('action'), {
                        type: $form.attr('method'),
                        data: $form.serialize(),
                        success: function (data) {
                            $.griffin.jsonResponse($target, data);
                        }
                    });                
                };
                
                if (typeof data === 'undefined') {
                    data = { };
                    
                    $this.click(function (e) {
                        e.preventDefault();

                        var overlay = $(this).elementOverlay();
                        $.get($(this).attr('href'), function (templateHtml) {
                            overlay.elementOverlay('hide');

                            var $dialog = $('<div class="dialog-container"></div>').appendTo('body');
                            $dialog.html(templateHtml);
                            $.triggerLoaded($dialog[0]);

                            var $buttons = $('input[type="submit"], input[type="button"]', $dialog).hide();
                            var options= {
                                title: 'Create template',
                                modal: true,
                                width: 'auto',
                                buttons: []
                            };
                            
                            $buttons.each(function () {
                                if ($(this).attr('type') === 'submit') {
                                    option.buttons.push({
                                        text: $(this).val(),
                                        click: function () {
                                            var $form = $('form', $dialog);
                                            if ($form.length === 0) {
                                                transformForm($form, self.data.target);
                                            }
                                        }
                                    });
                                } else {
                                    option.buttons.push({
                                        text: $(this).val(),
                                        click: function () {
                                            $dialog.dialog('close');
                                        }
                                    });                                
                                }
                            });
                            
                            $dialog.dialog(options);
                        });
                    });                    
                    var id = $this.attr('id') + '-overlay';
                    data.overlay = $(id);
                    
                    var contents = settings.overlayContents;
                    if (contents.substr(0,1) !== '#')
                        contents = contents.replace('{{id}}', id).replace('{{contents}}', title);
                        
                    if (data.overlay.length == 0) {
                        data.overlay = $(contents);
                        $('body').append(data.overlay);
                        this.reposition();
                    }

                    $(this).data('overlay', {
                        target: $this,
                        target2: this,
                        overlay: data.overlay,
                        settings: settings
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

    $.fn.elementOverlay = function(method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.elementOverlay');
        }

    };

})(jQuery);

$.loaded(function(parent) {
    $('a.ajax-dialog', parent).griffinAjaxDialog();
}

        $('#CreateTemplate').click(function (e) {
            e.preventDefault();

            var overlay = $(this).elementOverlay();
            $.get($(this).attr('href'), function (templateHtml) {
                overlay.elementOverlay('hide');

                var $dialog = $('<div class="dialog-container"></div>');
                $dialog.html(templateHtml);

                var $button = $('input[type="submit"]', $dialog).hide();
                $dialog.dialog({
                    title: 'Create template',
                    modal: true,
                    width: 'auto',
                    buttons: [{
                        text: $button.val(),
                        click: function () {
                            var $form = $('form', $dialog);
                            if (!$form.valid()) {
                                return;
                            }
                            $.ajax($form.attr('action'), {
                                type: $form.attr('method'),
                                data: $form.serialize(),
                                success: function (data) {
                                    $('#TemplateId').append('<option value="' + data.Body.Key + "'>" + data.Body.Label + '</option>');
                                    $('#TemplateId option[value="' + data.Body.Key + '"]').attr('selected', 'selected');
                                }
                            });
                        }
                    }]
                });


                $.triggerLoaded($dialog[0]);


            });
        });