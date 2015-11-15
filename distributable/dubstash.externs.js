/**
 * @fileoverview This file contains 'Extern' definitions that describe DubStash's interface for
 * Google Closure Compiler.
 *
 * You don't need this unless you want to compile your project with Google Closure Compiler.
 */

var DubStash = {

	/**
	 * Get a function that, when called, writes out the template while performing the necessary
	 * substitutions.
	 *
	 * @param {string} text
	 * @return {DubStash.ExternalRenderingFunction}
	 */
	compile: function(text){},


	/**
	 * Get the source of a function that, when called, writes out the template while performing
	 * the necessary substitutions. The source can then be saved and used instead of the
	 * template.
	 *
	 * @param {string} text The template text.
	 * @return {string}
	 */
	precompile: function(text){},


	/**
	 * Register a named sub-template that can be used anywhere in the hierarchy without changing
	 * context (i.e. without prefixing with ../ etc.), as if it is the value of a property.
	 *
	 * @param {string} name A unique name for the template.
	 * @param {string} text The uncompiled text of the template.
	 */
	registerGlobalTemplate: function(name, text){},


	/**
	 * Get the Javascript source code that, at run time, will register all the current global
	 * templates, in their precompiled form.
	 *
	 * @return {string}
	 */
	precompileGlobalTemplates: function(){},


	/**
	 * Register a named data object that can be used anywhere in the hierarchy without changing
	 * context (i.e. without prefixing with ../ etc.).
	 *
	 * @param {string} name A unique name for the data.
	 * @param {Object|string} data The data object or string.
	 */
	registerGlobalData: function(name, data){},


	/**
	 * Create a context for use when calling the rendering function that results from
	 * compiling a template.
	 *
	 * @param {Object} startObj The object that the paths in the template refer to.
	 * @param {string} startPath The path to the start object from the root object.
	 * @param {Object} rootObj The root object. Must contain startObj somewhere in its hierarchy.
	 * @return {DubStash.runtime.Context}
	 */
	createContext: function(startObj, startPath, rootObj){},


	/**
	 * @param {Array.<DubStash.ContextualRenderingFunction>} renderers
	 * @param {Object} data
	 * @param {boolean=} opt_ignoreUndefined
	 * @param {DubStash.runtime.Context=} opt_startContext
	 * @return {string}
	 */
	T: function(renderers, data, opt_ignoreUndefined, opt_startContext){},

	/**
	 * @param {string} name
	 * @param {boolean} isRecursive
	 * @param {boolean} htmlEscape
	 * @param {Object} data
	 * @param {boolean=} ignoreUndefined
	 * @return {string}
	 */
	P: function(name, isRecursive, htmlEscape, data, ignoreUndefined){},

	/**
	 * @param {string} name
	 * @param {boolean} isRecursive
	 * @param {Array.<DubStash.ContextualRenderingFunction>} trueRenderers
	 * @param {Array.<DubStash.ContextualRenderingFunction>} falseRenderers
	 * @param {Object} data
	 * @param {boolean=} ignoreUndefined
	 * @return {string}
	 */
	C: function(name, isRecursive, trueRenderers, falseRenderers, data, ignoreUndefined){},

	/**
	 * @param {string} name
	 * @param {Array.<DubStash.ContextualRenderingFunction>} subRenderers
	 * @param {Object} data
	 * @param {boolean=} ignoreUndefined
	 * @return {string}
	 */
	I: function(name, subRenderers, data, ignoreUndefined){},

	/**
	 * @param {string} name A unique name for the template.
	 * @param {DubStash.ExternalRenderingFunction} renderer A rendering function.
	 */
	G: function(name, renderer){}
};


/**
 * @typedef {function(Object, boolean=, DubStash.runtime.Context=):string}
 */
DubStash.ExternalRenderingFunction;


/**
 * @typedef {function(DubStash.runtime.Context, boolean=):string}
 */
DubStash.ContextualRenderingFunction;


/**
 * @param {Object} currentObj
 * @param {string} currentPath
 * @param {Object} rootObj
 * @constructor
 */
DubStash.runtime.Context = function(currentObj, currentPath, rootObj){};
