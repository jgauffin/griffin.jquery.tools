/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 
 Created by Jonas Gauffin. http://www.gauffin.org
 
 Usage:
 
 $('.tour').on('click', function() { $('#my-tour').griffinTour(); });
 
 */

(function($) {
    "use strict";


    var methods = {
        init: function(options) {
            var settings = $.extend({
                overlay: '#griffin-tour-overlay',
                container: '#griffin-tour-container',
                effect: 'highlight',
                quit: function() {}
            }, options);

            return this.each(function() {
                var $this = $(this);
                var self = this;
                var data = $this.data('griffin-tour');
                
                // credits: http://stackoverflow.com/a/7557433/70386
                this.elementInViewport = function(el) {
                    var rect = el.getBoundingClientRect()

                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= window.innerHeight &&
                        rect.right <= window.innerWidth 
                        )
                }

                this.start = function() {
                    data.overlay.show();
                    data.overlay.addClass('ui-widget-overlay');
                    
                    var height = $('body').height();
                    if (height < $(window).height())
                        height = $(window).height();
                    data.overlay.height(height);
                    if (data.index >= data.items.length - 1) {
                        $('.next', data.container).hide();
                    }
                    $('.previous', data.container).hide();
                    this.spotlight(0);
                    
                }
                this.spotlight = function(index) {
                    var item  = data.items[index];
                    
                    $('.contents', data.container).html(item.html());
                    
                    var targetItem = $(item.attr('data-for'));
                    if (targetItem.length === 0) {
                        data.container.position({
                            "my": "center center",
                            "at": "center center",
                            "of": $(window)
                        });
                        if (data.container.css('display') === 'none') {
                            data.container.show();
                        }
                        
                        return;
                    }
                    
                    targetItem.addClass('griffin-tour-spotlight');
                    data.container.position({
                        "my": "left top",
                        "at": "left bottom",
                        "of": targetItem
                    });
                    
                    if (!self.elementInViewport(targetItem[0])) {
                        $( 'body, html' ).animate({
                            scrollTop: targetItem.offset().top
                        }, 1000, function() {
                            if (data.container.css('display') === 'none') {
                                data.container.show();
                            }
                            targetItem.effect('highlight');
                        });
                    } else
                    {
                        if (data.container.css('display') === 'none') {
                            data.container.show();
                        }
                        targetItem.effect('highlight');
                    }
                };
                
                this.fadeAway = function(index) {
                    var item  = data.items[index];
                    var targetItem = $(item.attr('data-for'));
                    targetItem.removeClass('griffin-tour-spotlight');
                }
                
                this.moveNext = function () {
                    self.fadeAway(data.index);
                    data.index = data.index + 1;
                    self.spotlight(data.index);
                    if (data.index >= data.items.length - 1) {
                        $('.next', data.container).hide();
                    }
                    if (!$('.previous', data.container).is(':visible')) {
                        $('.previous', data.container).show();
                    }
                };
                
                this.movePrev = function() {
                    self.fadeAway(data.index);
                    data.index = data.index - 1;
                    self.spotlight(data.index);
                    if (data.index <= 0) {
                        $('.previous', data.container).hide();
                    }
                    if (!$('.next', data.container).is(':visible')) {
                        $('.next', data.container).show();
                    }
                };
                
                this.quit = function () {
                    data.container.hide();
                    data.overlay.hide();
                    //data.overlay.removeClass('ui-widget-overlay');
                    self.fadeAway(data.index);
                    data.index = 0;
                    data.options.quit();
                };
                

                if (typeof data !== 'undefined') {
                    return this;
                }

                data = { };
                data.container = $(settings.container);
                if (data.container.length === 0) {
                    data.container = $('<div id="griffin-tour-container" style="display: none;">' +
                        '    <div class="contents">' +
                        '    </div>' +
                        '    <div class="footer">' +
                        '        <a href="#" class="previous">&lt;&lt; Previous</a>' +
                        '        <a href="#" class="quit">Quit guide</a>' +
                        '        <a href="#" class="next">Next &gt;&gt; </a>' +
                        '    </div>' +
                        '</div>').appendTo('body');
                }
                data.overlay = $(settings.overlay);
                if (data.overlay.length === 0) {
                    data.overlay = $('<div id="griffin-tour-overlay" style="display: none;"></div>').appendTo('body');
                }
                data.index = 0;
                data.self = this;
                data.options = settings;
                data.items = [];
                $('div', this).each(function() {
                    data.items.push($(this));
                    $(this).hide();
                });
                $(this).data('griffin-tour', data);
                
                $('.next', data.container).on('click', function(e) {
                    e.preventDefault();
                    self.moveNext();
                });
                
                $('.previous', data.container).on('click', function(e) {
                    e.preventDefault();
                    self.movePrev();
                });

                $('.quit', data.container).on('click', function(e) {
                    e.preventDefault();
                    self.quit();
                });                
                
                // scroll center items (no data-for) when scrollbar is used.
                $(window).scroll(function() {
                    if (typeof data.items[data.index].attr('data-for') !== 'undefined'
                        || data.container.css('display') === 'none') {
                        return;
                    }
                    
                    var pos = $(window).scrollTop();
                        data.container.position({
                            "my": "center center",
                            "at": "center center",
                            "of": $(window)
                        });
                });
                
                this.start();

                return this;
            });
        },
        destroy: function( ) {

            return this.each(function() {

                var $this = $(this),
                    data = $this.data('griffin-tour');

                // Namespacing FTW
                $(window).unbind('.elementOverlay');
                data.overlay.remove();
                $this.removeData('overlay');

            });
        },
                
        /** Hide the tour */
        hide: function() {
            var $this = $(this),
                data = $this.data('griffin-tour');
                
            this.quit();
        }
    };

    $.fn.griffinTour = function(method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.griffinTour');
        }

    };

})(jQuery);    