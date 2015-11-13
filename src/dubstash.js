/**
 * @fileoverview This is the public interface to the library.
 */


goog.provide('DubStash');

goog.require('DubStash.Compiler');
goog.require('DubStash.Runtime');
goog.require('DubStash.runtime.Context');


/**
 * @export
 */
DubStash.VERSION = '1.0.0';


/**
 * Get a function that, when called, writes out the template while performing the necessary
 * substitutions.
 *
 * @param {string} text The template text.
 * @return {DubStash.ExternalRenderingFunction}
 * Where the params of the returned function are:
 *     {Object} data An object whose fields will be substituted into the placeholders, or
 *        tested by conditions.
 *     {boolean=} opt_ignoreUndefined Whether to leave alone placeholders whose value is
 *        undefined or to replace them with nothing (default: replace with nothing).
 *     {Context=} opt_startContext A context created by calling createContext. Specifies that
 *        all paths in the template should be considered relative to the current context
 *        object, and not relative to the 'data' object.
 * @export
 */
DubStash.compile = function(text){

    var compiler = new DubStash.Compiler(text);
    return compiler.getRenderer();
};


/**
 * Get the source of a function that when called writes out the template while performing
 * the necessary substitutions. The source can then be saved and used instead of the
 * template.
 *
 * @param {string} text The template text.
 * @return {string}
 * Where the params of the returned function are:
 *     {Object} data An object whose fields will be substituted into the placeholders, or
 *        tested by conditions.
 *     {boolean=} opt_ignoreUndefined Whether to leave alone placeholders whose value is
 *        undefined or to replace them with nothing (default: replace with nothing).
 * @export
 */
DubStash.precompile = function(text){

    var compiler = new DubStash.Compiler(text);
    return compiler.getRendererSource();
};


/**
 * Register a named sub-template that can be used anywhere in the hierarchy without changing
 * context (i.e. without prefixing with ../ etc.), as if it is the value of a property.
 *
 * @param {string} name A unique name for the template.
 * @param {string} text The uncompiled text of the template.
 * @export
 */
DubStash.registerGlobalTemplate = function(name, text){

    DubStash.Runtime.getInstance().registerGlobalRenderer(name, DubStash.compile(text));

    // Remember the template for use during precompileGlobalTemplates.
    DubStash.globalTemplates_[name] = text;
};


/**
 * Cache of global templates. Used only when precompiling global templates.
 *
 * @type {Object<string, string>}
 * @private
 */
DubStash.globalTemplates_ = {};


/**
 * Get the Javascript source code that, at run time, will register all the current global
 * templates, in their precompiled form.
 *
 * @return {string}
 * @export
 */
DubStash.precompileGlobalTemplates = function(){

    var lines = [''];
    for (var name in DubStash.globalTemplates_){
        var compiler = new DubStash.Compiler(DubStash.globalTemplates_[name]);
        lines.push('DubStash.G(\'' + name + '\', ' + compiler.getRendererSource() + ');');
    };
    return lines.join('\n');
};


/**
 * Register a named data object that can be used anywhere in the hierarchy without changing
 * context (i.e. without prefixing with ../ etc.).
 *
 * @param {string} name A unique name for the data.
 * @param {Object|string} data The data object or string.
 * @export
 */
DubStash.registerGlobalData = function(name, data){

    DubStash.Runtime.getInstance().registerGlobalData(name, data);
};


/**
 * Create a context for use when calling the rendering function that results from
 * compiling a template.
 *
 * @param {Object} startObj The object that the paths in the template refer to.
 * @param {string} startPath The path to the start object from the root object.
 * @param {Object} rootObj The root object. Must contain startObj somewhere in its hierarchy.
 * @return {DubStash.runtime.Context}
 * @export
 */
DubStash.createContext = function(startObj, startPath, rootObj){

    return new DubStash.runtime.Context(startObj, startPath, rootObj);
};


goog.exportSymbol('DubStash.G', DubStash.Runtime.registerGlobalRenderer);
goog.exportSymbol('DubStash.T', DubStash.Runtime.renderTemplate);
goog.exportSymbol('DubStash.P', DubStash.Runtime.renderPlaceHolderBlock);
goog.exportSymbol('DubStash.C', DubStash.Runtime.renderConditionBlock);
goog.exportSymbol('DubStash.I', DubStash.Runtime.renderIteratorBlock);


// Make available in Node or the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = goog.global['DubStash']; // That's where the compiler exported everything to.
}
