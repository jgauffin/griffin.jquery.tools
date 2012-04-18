/** Displays an overlay over the specified item.
 *
 * Usage:
 *
 * var overlay = $('#MyTable').elementOverlay();
 * $.get('/Some/Url', function(data) {
 *     overlay.elementOverlay('hide');
 
 *     // process data;
 * });
 *
 *
 * Styling:
 * 
 * Container got the class 'element-overlay-container'
 * There is an inner div for the contents.
 *
 * div.element-overlay-container        Style the actual overlay
 * div.element-overlay-container div    Style the contents
 */
(function($) {
    "use strict";
    
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
                overlay: '<div class="ui-widget-overlay element-overlay-bk" id="{{id}}"></div>',
                spinner: '<div class="element-overlay-contents">{{contents}}</div>',
                title: $.elementOverlay.texts.title
            }, options, true);

            return this.each(function() {
                var $this = $(this);
                var self = this;
                var data = $this.data('griffin-element-overlay');
                

                this.reposition = function() {
                    var pos = $this.offset();
                    if (!pos) {
                        pos = { top: 0, left: 0 };
                    }
                    data.overlay.css({
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        width: $this.width() + "px",
                        height: $this.height() + "px"
                    });
                    data.spinner.css({
                        zindex: 100,
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        width: $this.width() + "px",
                        height: $this.height() + "px"
                    });
                    $(data.spinner).css('padding-top', (($this.height() / 2) - 20) + 'px');
                };
                
                if (typeof data === 'undefined') {
                    data = { settings: settings, self: this };
                    var id = $this.attr('id') + '-overlay';
                    
                    data.overlay = settings.overlay;
                    if (data.overlay.substr(0,1) !== '#') {
                        data.overlay = data.overlay.replace('{{id}}', id);
                    }
                    data.overlay = $(data.overlay);
                    
                    data.spinner = settings.spinner;
                    if (data.spinner.substr(0,1) !== '#') {
                        data.spinner = data.spinner.replace('{{contents}}', settings.title);
                    }
                    data.spinner = $(data.spinner);
                    
                    $('body').append(data.overlay);
                    $('body').append(data.spinner);
                    this.reposition();

                    $(this).data('griffin-element-overlay', data);

                } else {
                    methods['show'].apply(self);
                }
                
                return this;
            });
        },
        destroy: function( ) {

            return this.each(function() {

                var $this = $(this),
                    data = $this.data('griffin-element-overlay');

                // Namespacing FTW
                $(window).unbind('.elementOverlay');
                data.overlay.remove();
                data.spinner.remove();
                $this.removeData('overlay');

            });
        },
        
        show: function( ) {
            var $this = $(this),
                data = $this.data('griffin-element-overlay');

            data.self.reposition();
            data.overlay.show();
            data.spinner.show();
            return this;
        },
        hide: function( ) {
            var $this = $(this),
                data = $this.data('griffin-element-overlay');

            data.overlay.hide();
            data.spinner.hide();
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