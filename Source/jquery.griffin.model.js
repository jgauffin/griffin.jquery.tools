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

// selfish.js
!(typeof define!=="function"?function($){$(null,typeof exports!=='undefined'?exports:window)}:define)(function(require,exports){"use strict";exports.Base=Object.freeze(Object.create(Object.prototype,{'new':{value:function create(){var object=Object.create(this);object.initialize.apply(object,arguments);return object}},initialize:{value:function initialize(){}},merge:{value:function merge(){var descriptor={};Array.prototype.forEach.call(arguments,function(properties){Object.getOwnPropertyNames(properties).forEach(function(name){descriptor[name]=Object.getOwnPropertyDescriptor(properties,name)})});Object.defineProperties(this,descriptor);return this}},extend:{value:function extend(){return Object.freeze(this.merge.apply(Object.create(this),arguments))}}}))});

var RestlessRepository = Base.extend({
    _self = this,
    _items = [],
    
    initialize: function(modelName, uri) {
        this.modelName = modelName;
        if (typeof uri === 'undefined' || uri === null) {
            this.uri = '/' + modelName + '/';
        } else {
            if (uri.substr(uri.length - 1, 1) !== '/') {
                uri = uri + '/';
            }
            this.uri = uri;
        }
    }
    
    getId: function(item) {
    }
    
    /** Distributes the changes to everyone listening */
    publish: function() {
        
    },
    
    _getItem: function(itemOrId) {
        if (typeof itemOrId === 'number') {
            return _items[itemOrId];
        }
        
        return _items[_self.getId(itemOrId)];
    },
    
    load: function(id) {
    
    },
    
    setItem: function(item) {
        _items[_self.getId(item)] = item;
    },
    
    update: function(model) {
        _self._perform('update', 'updated', model);
    },
    
    create: function(model) {
        _self._perform('create', 'created', model);
    },
    
    delete: function(modelOrId) {
        var id = modelOrId;
        if (typeof id !== 'number') {
            id = _self.getId(modelOrId);
        }
        
        var result = $.post(url + 'delete/' + id, model, function(data) {
            if (response.success) {
                delete _items[id];
                PubSub.publish('griffin.model.' + _self.modelName + '.deleted', data);
            } else {
                PubSub.publish('griffin.response', data);
            }
        });
    },
    
    _perform: function(actionName, eventName, model) {
        var result = $.post(url + actionName + '/' + model.id, model, function(data) {
            if (response.success) {
                _self.setItem(data);
                PubSub.publish('griffin.model.' + _self.modelName + '.' + eventName, data);
            } else {
                PubSub.publish('griffin.response', data);
            }
        });
    }
})



// our script.
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