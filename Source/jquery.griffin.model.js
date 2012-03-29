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
isArray = function(obj) {
    "use strict";
	return Object.prototype.toString.call(obj) === '[object Array]';
};

// selfish.js
!(typeof define!=="function"?function($){$(null,typeof exports!=='undefined'?exports:window)}:define)(function(require,exports){"use strict";exports.Base=Object.freeze(Object.create(Object.prototype,{'new':{value:function create(){var object=Object.create(this);object.initialize.apply(object,arguments);return object}},initialize:{value:function initialize(){}},merge:{value:function merge(){var descriptor={};Array.prototype.forEach.call(arguments,function(properties){Object.getOwnPropertyNames(properties).forEach(function(name){descriptor[name]=Object.getOwnPropertyDescriptor(properties,name)})});Object.defineProperties(this,descriptor);return this}},extend:{value:function extend(){return Object.freeze(this.merge.apply(Object.create(this),arguments))}}}))});

var RestlessRepository = Base.extend({
    _self: this,
    _items: [],
    
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
    },
    
    getId: function(item) {
        return $.griffin.model.getId(item);
    },
    
    /** Distributes the changes to everyone listening */
    publish: function() {
        
    },
    
    _getItem: function(itemOrId) {
        if (typeof itemOrId === 'number') {
            return this._items[itemOrId];
        }
        
        return this._items[this.getId(itemOrId)];
    },
    
    load: function(modelOrId) {
        if (typeof modelOrId === 'number') {
            return this._getItem(modelOrId);
        }
    
        this._items[this.getId(modelOrId)] = modelOrId;
        PubSub.publish('griffin.model.' + this.modelName + '.loaded', { modelName: this.modelName, model: modelOrId });
    },
    
    setItem: function(item) {
        this._items[this.getId(item)] = item;
    },
    
    update: function(model) {
        this._perform('update', 'updated', model);
    },
    
    create: function(model) {
        this._perform('create', 'created', model);
    },
    
    handleMessage: function(data) {
        switch (data.actionName) {
            case 'create':
                PubSub.publish('griffin.model.' + this.modelName + '.created', { modelName: this.modelName, model: data.model });
                //fallthrough
            case 'load':
                this.load(data.model);
                break;
            case 'update':
                this.setItem(data.model);
                PubSub.publish('griffin.model.' + this.modelName + '.updated', { modelName: this.modelName, model: data.model });
                break;
            case 'delete':
                delete this._items[this.getId(data.model)];
                PubSub.publish('griffin.model.' + this.modelName + '.deleted', { modelName: this.modelName, model: data.model });
                break;
        }
    },
    
    delete: function(modelOrId) {
        var id = modelOrId;
        if (typeof id !== 'number') {
            id = this.getId(modelOrId);
        }
        
        var result = $.post(uri + 'delete/' + id, model, function(data) {
            if (response.success) {
                delete this._items[id];
                PubSub.publish('griffin.model.' + _self.modelName + '.deleted', { modelName: this.modelName, model: model });
            } else {
                PubSub.publish('griffin.response', data);
            }
        });
    },
    
    _perform: function(actionName, eventName, model) {
        var result = $.post(url + actionName + '/' + model.id, model, function(data) {
            if (response.success) {
                _self.setItem(data);
                PubSub.publish('griffin.model.' + _self.modelName + '.' + eventName, { modelName: this.modelName, model: model });
            } else {
                PubSub.publish('griffin.response', data);
            }
        });
    }
});



// our script.
(function($) {
    "use strict";
   
   //$.griffin = {};
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
            var templateNode = $('[data-template-for="' + $target.attr('id') + '"]');
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
		item.data('griffin.model', data);
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
        var _repositories = {},
            self = this,
			publish = function(name, args) {
                PubSub.publish(name, args);
            };

        /** @returns id of the specified model */
        this.getId = function(item) {
            if (typeof item === 'number') {
               return item;
            }    
           
            return item.id;
        };
		
        this.getRepos = function(modelName) {
            return _repositories[modelName];
        };
        
		this.createRepository = function(modelName) {
			return RestlessRepository.new(modelName);
		};
        
        /** Initialize models and load their controllers. */
        this.init = function(modelNames) {
            $.each(modelNames, function(index, modelName){
                var repos = self.createRepository(modelName);
                _repositories[modelName] = repos;
            });
        };
		
		this.from = function($obj) {
			var selector = '';
			if ($obj[0].tagName === 'FORM') {
				selector = 'input[type!="submit"], input[type!="button"]';
			} else if ($obj[0].tagName === 'TR') {
				return $obj.data('griffin.model');
			}
			
			var arr = [];
			$('input[type!="submit"], input[type!="button"]', $obj).each(function() {
				var name = $(this).attr('name');
				if (typeof name === 'undefined') {
					return this;
				}
				var value = $(this).val();
				arr[name] = value;
			});
			console.log(arr);
			
			return $.extend({}, arr);
		}
		
        PubSub.subscribe('griffin.model', function(eventName, data) {
            if (eventName.substr(-4, 4) === 'load') {
                self.getRepos(data.modelName).handleMessage(data);
            }
            else if (eventName.substr(-7, 7) === 'deleted') {
                self.remove(data.modelName, data.model);
            }
            else if (eventName.substr(-6, 6) === 'loaded' || eventName.substr(-7, 7) === 'updated') {
                self.load(data.modelName, data.model);
            }
        });
        
        this.add = function(modelName, items) {
            if (!isArray(items)) {
					items = [items];
				}
				
            var repos = self.getRepos(modelName);
            $.each(items, function(index, item) {
                repos.load(item);
            });
        }
        
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
				var id = self.getId(itemData).toString();
				
				if ($target.attr('data-model-id') && $target.attr('data-model-id') !== id) {
					return;
				}
				
                var $existing = $('[data-model-id="' + id + '"]', $target);
                if ($existing.length === 1) {
                    $existing.replaceWith($.griffin.renderItem($target, itemData));
					publish('griffin.model.' + modelName + '.node-updated.' + self.getId(itemData), { model: itemData, modelName: modelName, target: $target });
                } else {
                    var node = $.griffin.renderItem($target, itemData).appendTo($target);
					publish('griffin.model.' + modelName + '.node-created.' + self.getId(itemData), { model: itemData, modelName: modelName, target: $(node) });
                }    
            };
    
            $('[data-model-name="' + modelName + '"]').each(function() {
                
                var $this = $(this);
                if (!isArray(data)) {
					data = [data];
				}
				
				
				$.each(data, function(index, item) {
					updateItem($this, item);
				});
            });
        };
        
        /** Remove a model  */
        this.remove = function(modelName, model) {
            var id = model.id;
            if (typeof id !== 'number') {
                id = self.getId(model);
            }
            
            $('[data-model-name="' + modelName + '"]').each(function() {
                var $this = $(this);
                if (typeof $this.attr('data-model-id') === 'undefined') {
                    $('[data-model-id="' + id + '"]', $this).each(function() {
                        $(this).remove();
                    });
                }
                else {
                    $this.remove();
                }
            });
        };
        
        
    };
    
    $.griffin.model = new $.griffin.model.Object();

})(jQuery);    