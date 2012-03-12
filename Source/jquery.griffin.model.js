/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. 
 
 Created by Jonas Gauffin. http://www.gauffin.org
 
 Light-weight model binding for jQuery.
 
 */
 
 String.prototype.capitalize = function(){
    "use strict";
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

(function($) {
    "use strict";
   
   $.griffin = {};
    /** Uses jsRender or jQuery.tmpl to render views */
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
        item.attr('data-model-id', $.griffin.model.getId(data));
        return item;    
    };    
    
    /** A light weight view mapper for jQuery 
     *
     * Use the attribute data-model-name="user" to receive updates for a user model.
     * data-model-id is used to identify a row in a table etc (so that it's updated properly)
     *
     */
    $.griffin.model = {};
    $.griffin.model.Object = function() {
        var _models = [],
            _controllers = [],
            self = this,
            set = function(modelName, item) {
                if (typeof _models[modelName] === 'undefined') {
                    _models[modelName] = [];
                }
            
                _models[modelName][self.getId(item)] = item;
            },
            get = function(modelName, id) {
                if (typeof id === 'number') {
                    return _models[modelName][id];
                }
                
                return _models[modelName][self.getId(id)];
            },
            publish = function(name, args) {
                PubSub.publish(name, args);
            },
            isArray = function(obj) {
                return Object.prototype.toString.call(obj) === '[object Array]';
            };

        /** @returns id of the specified model */
        this.getId = function(item) {
            if (typeof item === 'number') {
               return item;
            }    
           
            return item.id;
        };
        
        /** Initialize models and load their controllers. */
        this.init = function(modelNames) {
            $.each(modelNames, function(index, modelName){
                var controllerName = modelName.capatilize() + "Controller";
                if (!window.hasOwnProperty(controllerName)) {
                    throw 'Expected to find a controller for ' + controllerName;
                }
                
                _controllers[modelName] = window[controllerName];
            });
        };
        
        /** Load a model (or an array of models).
          *
          * Updates a model which already have been mapped.
          *
          * @param modelName name of the model
          * @param object (single model) or an array of objects (several models)
          */
        this.load = function(modelName, data) {
            /** Add/Update an item (find all selectors matching the item id)
             * @param $target Selector
             * @param itemData data for a single node
             */
            var updateItem = function($target, itemData) {
                var $existing = $('[data-model-id="' + self.getId(itemData) + '"]', $target);
                if ($existing.length === 1) {
                    $existing.replaceWith($.griffin.renderItem($target, itemData));
                    publish('griffin.node.' + modelName + '.added.' + self.getId(itemData), { node: $existing[0], data: itemData, target: $target[0], modelName: modelName});
                } else {
                    var node = $.griffin.renderItem($target, itemData).appendTo($target);
                    publish('griffin.node.' + modelName + '.updated.' + self.getId(itemData), { node: node, data: itemData, target: $target[0], modelName: modelName });
                }    
            };
    
            $('[data-model-name="' + modelName + '"]').each(function() {
                
                var $this = $(this);
                if (!isArray(data)) {
                    publish('griffin.model.' + modelName + '.loading.' + self.getId(data), { data: data, modelName: modelName });
                    set(modelName, data);
                    updateItem($this, data);
                    publish('griffin.model.' + modelName + '.loaded.' + self.getId(data), { data: data, modelName: modelName });
                } else {
                    $.each(data, function(index, item) {
                        console.log(item);
                        console.log(self);
                        publish('griffin.model.' + modelName + '.loading.' + self.getId(item), { data: item, modelName: modelName });
                        set(modelName, item);
                        updateItem($this, item);
                        publish('griffin.model.' + modelName + '.loaded.' + self.getId(item), { data: item, modelName: modelName });
                    });
                }
            });
        };
        
        /** Remove a model  */
        this.remove = function(modelName, id) {
            if (_models[modelName] === 'undefined') {
                _models[modelName] = [];
            }
            if (typeof id !== 'number') {
                id = self.getId(id);
            }
            
            var item = $.griffin.model.items[modelName][id];
            
            $('[data-model-name="' + modelName + '"]').each(function() {
                var $this = $(this);
                if (typeof $this.attr('data-model-id') === 'undefined') {
                    $('[data-model-id="' + id + '"]', $this).each(function() {
                        publish('griffin.node.' + modelName + '.deleted.' + id, { node: this, data: item, target: $this[0], modelName: modelName});
                        $(this).remove();
                    });
                }
                else {
                    $this.remove();
                    publish('griffin.node.' + modelName + '.deleted.' + id, { node: this, data: item, target: this, modelName: modelName});
                }
            });
            
            publish('griffin.model.' + modelName + '.deleted.' + id, { data: item, modelName: modelName });
            delete _models[modelName][id];
        };
        
        
    };
    
    $.griffin.model = new $.griffin.model.Object();

})(jQuery);    