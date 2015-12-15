goog.provide('DubStash.runtime.Runtime');

goog.require('DubStash.runtime.Context');


/**
 * A collection of methods for rendering compiled blocks once we have the data available to plug
 * in, i.e. at "runtime". This is all that is needed by precompiled rendering functions.
 *
 * @constructor
 */
DubStash.runtime.Runtime = function(){};
goog.addSingletonGetter(DubStash.runtime.Runtime);


/**
 * Register a named sub-template that can be used anywhere in the hierarchy without changing
 * context (i.e. without prefixing with ../ etc.).
 *
 * @param {string} name A unique name for the template.
 * @param {DubStash.functions.ExternalRenderingFunction} renderer A rendering function.
 */
DubStash.runtime.Runtime.prototype.registerGlobalRenderer = function(name, renderer){

    this.globalRenderers_[name] = renderer;
};


/**
 * The version of registerGlobalRenderer that is callable from a compiled function, i.e. without an
 * instance.
 *
 * @param {string} name A unique name for the template.
 * @param {DubStash.functions.ExternalRenderingFunction} renderer A rendering function.
 */
DubStash.runtime.Runtime.registerGlobalRenderer = function(name, renderer){

    DubStash.runtime.Runtime.getInstance().registerGlobalRenderer(name, renderer);
};


/**
 * @private
 * @type {Object<string,DubStash.functions.ExternalRenderingFunction>}
 */
DubStash.runtime.Runtime.prototype.globalRenderers_ = {};


/**
 * Register a named data object that can be used anywhere in the hierarchy without changing
 * context (i.e. without prefixing with ../ etc.).
 *
 * @param {string} name A unique name for the data.
 * @param {Object|string} data The data object or string.
 */
DubStash.runtime.Runtime.prototype.registerGlobalData = function(name, data){

    this.globalData_[name] = data;
};


/**
 * @private
 * @type {Object<string, (Object|string)>}
 */
DubStash.runtime.Runtime.prototype.globalData_ = {};


/**
 * Renders a compiled template (supplied in the form of a series of renderer functions
 * that were curried into the calling function).
 *
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} renderers
 * @param {Object} data
 * @param {boolean=} opt_ignoreUndefined
 * @param {DubStash.runtime.Context=} opt_startContext Context to start with. This is necessary when
 *        rendering a recursive template inside an iteration. For internal use only.
 * @return {string}
 */
DubStash.runtime.Runtime.prototype.renderTemplate = function(renderers, data, opt_ignoreUndefined,
        opt_startContext){

    // Create a context for the renderers to use.
    var context = opt_startContext || new DubStash.runtime.Context(data, '', data);

    var output = [];
    for (var i in renderers){
        output.push(renderers[i].call(null, context, opt_ignoreUndefined));
    };
    return output.join('');
};


/**
 * The version of renderTemplate that is callable from a compiled function, i.e. without an
 * instance.
 *
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} renderers
 * @param {Object} data
 * @param {boolean=} opt_ignoreUndefined
 * @param {DubStash.runtime.Context=} opt_startContext Context to start with. This is necessary when
 *        rendering a recursive template inside an iteration. For internal use only.
 * @return {string}
 */
DubStash.runtime.Runtime.renderTemplate = function(renderers, data, opt_ignoreUndefined, opt_startContext){

    return DubStash.runtime.Runtime.getInstance().renderTemplate(renderers, data, opt_ignoreUndefined,
        opt_startContext);
};


/**
 * Renders the value of a placeholder block.
 *
 * @param {string} name
 * @param {boolean} isRecursive
 * @param {boolean} htmlEscape
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.prototype.renderPlaceHolderBlock = function(name, isRecursive, htmlEscape, context,
        ignoreUndefined){

    var value = this.getValue_(name, context);

    if (ignoreUndefined && value === undefined){

        // Leave the placeholder unchanged, i.e. reconstruct it.
        return htmlEscape ? '{{' + name + '}}' : '{{{' + name + '}}}';

    } else {

        if (value === undefined || value === null){
            return '';
        } else {
            // Escape it BEFORE recursing - this will prevent double-escaping the results
            // from a recursed template.
            var text = htmlEscape ? this.htmlEscape_('' + value) : '' + value;

            // Recurse if required.
            if (isRecursive && text.indexOf('{{') !== -1) {
                // Need to compile text as a mini-template and render it.
                var render = this.compileRecursive_(text);
                text = render.call(null, context.rootObj, ignoreUndefined, context);
            };
            return text;
        };
    };
};


/**
 * The version of renderPlaceHolderBlock that is callable from a compiled function, i.e. without an
 * instance.
 *
 * @param {string} name
 * @param {boolean} isRecursive
 * @param {boolean} htmlEscape
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.renderPlaceHolderBlock = function(name, isRecursive, htmlEscape, context,
        ignoreUndefined){

    return DubStash.runtime.Runtime.getInstance().renderPlaceHolderBlock(name, isRecursive,
        htmlEscape, context, ignoreUndefined);
};


/**
 * Evaluates a property for truthiness and renders an appropriate value.
 *
 * @param {string} name
 * @param {boolean} isRecursive
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} trueRenderers
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} falseRenderers
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.prototype.renderConditionBlock = function(name, isRecursive, trueRenderers,
        falseRenderers, context, ignoreUndefined){

    // Get the value, recursively if necessary.
    var value = this.getValue_(name, context);
    // Recurse only if the value starts with {{ (and strictly speaking, ends with }}).
    // Otherwise, there is something apart from template directives, i.e. it will
    // evaluate to truthy anyway.
    if (value && isRecursive && value.slice(0,2) === '{{' && value.slice(-2) === '}}'){
        var render = this.compileRecursive_(/** @type {string} */(value));
        value = render.call(null, context.rootObj, false, context);
    };

    // Decide which set of renderers to use.
    var renderers = value ? trueRenderers : falseRenderers;

    // Call the appropriate set of rendering functions in turn, and string the results
    // together.
    var output = [];
    for (var i in renderers){
        output.push(renderers[i].call(null, context, ignoreUndefined));
    };

    return output.join('');
};


/**
 * The version of renderConditionBlock that is callable from a compiled function, i.e. without an
 * instance.
 *
 * @param {string} name
 * @param {boolean} isRecursive
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} trueRenderers
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} falseRenderers
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.renderConditionBlock = function(name, isRecursive, trueRenderers,
        falseRenderers, context, ignoreUndefined){

    return DubStash.runtime.Runtime.getInstance().renderConditionBlock(name, isRecursive,
        trueRenderers, falseRenderers, context, ignoreUndefined);
};


/**
 * Iterates through a collection and renders the block for each value.
 *
 * @param {string} name
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} subRenderers
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.prototype.renderIteratorBlock = function(name, subRenderers, context,
        ignoreUndefined){

    // Get the value, which should be an iterable collection.
    var collection = /** @type {DubStash.runtime.Collection} */(this.getValue_(name, context));

    var output = [];

    // Iterate through the collection, writing out our sub-blocks for each item.
    if (collection){

        // The individual items we will now render need their own context.
        // Build the path of the member. 'name' refers to the collection. Use a made-up
        // name to refer to the item retrieved from the collection.
        var memberPath = context.currentPath.length ?
            context.currentPath + '.' + name : name;
        memberPath += '.[item]';

        // Create a general context, which will be customised for each item.
        var itemContext = new DubStash.runtime.Context(null, memberPath, context.rootObj);

        this.forEach_(collection, function(member){
            for (var i in subRenderers){
                itemContext.currentObj = /** @type {Object} */(member);
                output.push(subRenderers[i].call(null, itemContext, ignoreUndefined));
            };
        });
    };

    return output.join('');
};


/**
 * The version of RenderingFunction that is callable from a compiled function, i.e. without an
 * instance.
 *
 * @param {string} name
 * @param {Array<DubStash.functions.ContextualRenderingFunction>} subRenderers
 * @param {DubStash.runtime.Context} context
 * @param {boolean=} ignoreUndefined
 * @return {string}
 */
DubStash.runtime.Runtime.renderIteratorBlock = function(name, subRenderers, context,
        ignoreUndefined){

    return DubStash.runtime.Runtime.getInstance().renderIteratorBlock(name, subRenderers, context,
        ignoreUndefined);
};


/**
 * Compile the results of a recursive placeholder that was just evaluated. Cache the
 * rendering function for reuse. Caching is especially useful for iterations where each
 * item has a recursive placeholder.
 *
 * @param {string} text
 * @return {DubStash.functions.ExternalRenderingFunction}
 * @private
 */
DubStash.runtime.Runtime.prototype.compileRecursive_ = function(text){

    var renderer;
    if (text){
        renderer = this.rendererCache_[text];
    };

    if (!renderer){
        renderer = DubStash.compile(text);
        this.rendererCache_[text] = renderer;
    };

    return renderer;
};


DubStash.runtime.Runtime.prototype.rendererCache_ = {};


/**
 * At runtime, return the value of a multi.level.property of an object.
 *
 * @param {string} name A property name to evaluate on obj. May contain dots, or a climbing
 *        prefix, e.g. ../
 * @param {DubStash.runtime.Context} context A context object.
 * @return {*}
 * @private
 */
DubStash.runtime.Runtime.prototype.getValue_ = function(name, context){

    // If name starts with ../ we need to change context to an ancestor.
    context = this.getAncestorContext_(name, context); // Just do the climbing

    // Now that we have the ancestor context, we can strip the leading ../
    // getAncestorContext_ actually did it for us.
    if (context.name){
        name = context.name;
        var climbed = true;
    };

    // Drill down to the end of the multi.segment.name, changing the context as we go.
    // Cycle through all except the last segment.

    // First: clone the context, because don't want to change the original.
    var drilledContext = new DubStash.runtime.Context(context.currentObj, context.currentPath,
        context.rootObj);
    var segments = name.split('.');
    var lastSegmentIndex = segments.length - 1;
    for (var i = 0; i < lastSegmentIndex; i++){
        var nextObj = this.evaluate_(drilledContext, segments[i]);
        if (nextObj !== undefined){
            var nextPath = drilledContext.currentPath ?
                [drilledContext.currentPath, segments[i]].join('.') : segments[i];
            drilledContext.currentObj = /** @type {Object} */(nextObj);
            drilledContext.currentPath = nextPath;
        } else {
            // Cannot complete the path using the local data context.
            // Try using the global context.
            if (context !== this.globalContext_ && !climbed){
                return this.getValue_(name, this.globalContext_);
            } else {
                return undefined;
            };
        };
    };

    // Our context now points to an object which we hope has a property accessible using
    // the last segment.
    var value = this.evaluate_(drilledContext, segments[lastSegmentIndex]);

    if (context !== this.globalContext_ && !climbed && value === undefined){
        // Couldn't get a value using the local data context. Try using the global context.
        value = this.getValue_(name, this.globalContext_);
    };

    return value;
};


/**
 * Evaluates an object property. Empty arrays and objects are falsy.
 *
 * @param {DubStash.runtime.Context} context A context object, where currentObj contains the
 *      property we want.
 * @param {string} property The name of the property we want to evaluate.
 * @return {*}
 * @private
 */
DubStash.runtime.Runtime.prototype.evaluate_ = function(context, property){

    var obj = context.currentObj;
    var value;

    if (obj === null){
        // The object could have been an empty {} or [] that we converted to null. Either
        // way, it does not have the desired property.
        return undefined;

    } else if (property in obj){

        if (typeof obj[property] === 'function'){
            // Call it.
            value = obj[property]();

        } else {
            value = obj[property];
        };

    } else {
        // Is it a global template?
        var renderer = this.globalRenderers_[property];
        if (renderer){
            value = renderer.call(null, context.rootObj, undefined, context);
        };
    };

    // If the value is an empty array or an object with no values, return null. This
    // allows using {{if collection}} to test whether the collection has any values.
    // Unlike Python, in Javascript [] and {} are both truthy. In this case, the Python
    // behaviour is more desirable, as an empty collection is falsy.
    if (typeof value === 'object'){
        if (value instanceof Array){
            return value.length ? value : null;
        } else {
            for(var p in value){
                // There is at least one key: bail out now.
                return value;
            };
            // No keys.
            return null;
        };
    } else {

        return value;
    };
};


/**
 * If the desired property name begins with '../', climb the levels of ../ and return
 * the corresponding context.
 *
 * @param {string} name
 * @param {DubStash.runtime.Context} context
 * @private
 */
DubStash.runtime.Runtime.prototype.getAncestorContext_ = function(name, context){

    // Find how many levels to climb.
    var levels = name.split('../').length - 1; // Assumes all ../ at the beginning.

    if (levels){

        // name refers to an object one or more level(s) above the supplied context.

        // Chop the last X segments off currentPath to get the path of the object that
        // 'name' is relative to, which is the ancestor we want. Note that the root object
        // has a path of '', so the currentPath does not show it.
        var currentPathSegments = (context.currentPath).split('.');
        var lastDesiredSegmentIndex = currentPathSegments.length - levels - 1;
        if (lastDesiredSegmentIndex < -1 /* i.e. higher than the root object */){
            console.log('Too many levels to climb from ' + context.currentPath + ' to ' +
                name + '. Will stop at the top.');
            lastDesiredSegmentIndex = -1;
        };

        if (lastDesiredSegmentIndex !== -1){
            // Get the absolute path of the reference object.
            var ancestorPath = currentPathSegments.slice(0, lastDesiredSegmentIndex + 1).join('.');

            // Get the object at that path. We need to use the root object's context for that.
            var rootContext = new DubStash.runtime.Context(context.rootObj, '', context.rootObj);
            var ancestorObj = /** @type {Object} */(this.getValue_(ancestorPath, rootContext));

        } else {
            // It's the root object.
            ancestorPath = '';
            ancestorObj = context.rootObj;
        };

        // Now build the context to return.
        var ancestorContext =
            new DubStash.runtime.Context(ancestorObj, ancestorPath, context.rootObj);

        // Pass back also a fixed value for name that isn't prefixd with ../
        ancestorContext.name = name.slice(levels * 3);

        return ancestorContext;

    } else {

        return context;
    };
};


/**
 * Cycle through each member of a collection, calling the callback with each member.
 *
 * @param {DubStash.runtime.Collection} collection An object that is supposed to be iterable.
 * @param {function(*)} callback Called with each member as a parameter.
 * @private
 */
DubStash.runtime.Runtime.prototype.forEach_ = function(collection, callback){

    if (typeof collection.forEach === 'function'){
        // The collection already has this functionality, so use it.
        collection.forEach(callback);

    } else if (typeof collection.__iterator__ === 'function'){

        // It has a Javascript 1.7 style iterator function. We might not actually be on 1.7,
        // so we cannot just say 'for value in collection'. We'll use the iterator
        // explicitly.
        var iterator = collection.__iterator__(false);
        var stopped = false;
        while (!stopped){
            try {
                var obj = iterator.next();
            } catch (ex){
                // Assume this is StopIterator. Since Node doesnt support this yet, it
                // is difficult to write a script that would get us the global StopIterator
                // error to compare with.
                stopped = true;
            };
            if (!stopped){
                callback.call(this, obj);
            };
        };

    } else if (typeof collection === 'object'){
        // Either we're on a platform where Array does not yet have forEach, or this is
        // an object, so iterate through its values.
        for (var i in collection){
            callback.call(this, collection[i]);
        };
    } else {
        // It's probably not a collection. Just return itself as the first and only member.
        callback.call(this, collection);
    };
};


/**
 * Make a string safe to be inserted where HTML expects regular text.
 *
 * @param {string} str
 * @return {string}
 * @private
 */
DubStash.runtime.Runtime.prototype.htmlEscape_ = function(str) {

    return str.replace(DubStash.runtime.Runtime.RE_AMP_, '&amp;')
              .replace(DubStash.runtime.Runtime.RE_LT_, '&lt;')
              .replace(DubStash.runtime.Runtime.RE_GT_, '&gt;')
              .replace(DubStash.runtime.Runtime.RE_QUOT_, '&quot;');
};


/**
 * @type {RegExp}
 * @private
 */
DubStash.runtime.Runtime.RE_LT_ = /</g;


/**
 * @type {RegExp}
 * @private
 */
DubStash.runtime.Runtime.RE_GT_ = />/g;


/**
 * @type {RegExp}
 * @private
 */
DubStash.runtime.Runtime.RE_AMP_ = /&/g;


/**
 * @type {RegExp}
 * @private
 */
DubStash.runtime.Runtime.RE_QUOT_ = /\"/g;

/**
 * @private
 */
DubStash.runtime.Runtime.prototype.globalContext_ = new DubStash.runtime.Context(
    DubStash.runtime.Runtime.getInstance().globalData_, '',
    DubStash.runtime.Runtime.getInstance().globalData_);
