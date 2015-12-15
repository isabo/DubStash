/**
 * @fileoverview This file contains 'Extern' definitions that describe DubStash's interface for
 * Google Closure Compiler.
 *
 * You don't need this unless you want to compile your own project with Google Closure Compiler.
 *
 * @externs
 */

var DubStash = {

	/**
	 * @param {string} text
	 * @return {DubStash.functions.ExternalRenderingFunction}
	 */
	compile: function(text){},


	/**
	 * @param {string} text
	 * @return {string}
	 */
	precompile: function(text){},


	/**
	 * @param {string} name
	 * @param {string} text
	 */
	registerGlobalTemplate: function(name, text){},


	/**
	 * @return {string}
	 */
	precompileGlobalTemplates: function(){},


	/**
	 * @param {string} name
	 * @param {Object|string} data
	 */
	registerGlobalData: function(name, data){},


	/**
	 * @param {Object} startObj
	 * @param {string} startPath
	 * @param {Object} rootObj
	 * @return {DubStash.runtime.Context}
	 */
	createContext: function(startObj, startPath, rootObj){},


	/**
	 * @param {Array.<DubStash.functions.ContextualRenderingFunction>} renderers
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
	 * @param {Array.<DubStash.functions.ContextualRenderingFunction>} trueRenderers
	 * @param {Array.<DubStash.functions.ContextualRenderingFunction>} falseRenderers
	 * @param {Object} data
	 * @param {boolean=} ignoreUndefined
	 * @return {string}
	 */
	C: function(name, isRecursive, trueRenderers, falseRenderers, data, ignoreUndefined){},

	/**
	 * @param {string} name
	 * @param {Array.<DubStash.functions.ContextualRenderingFunction>} subRenderers
	 * @param {Object} data
	 * @param {boolean=} ignoreUndefined
	 * @return {string}
	 */
	I: function(name, subRenderers, data, ignoreUndefined){},

	/**
	 * @param {string} name A unique name for the template.
	 * @param {DubStash.functions.ExternalRenderingFunction} renderer A rendering function.
	 */
	G: function(name, renderer){}
};


/**
 * @typedef {function(Object, boolean=, DubStash.runtime.Context=):string}
 */
DubStash.functions.ExternalRenderingFunction;


/**
 * @typedef {function(DubStash.runtime.Context, boolean=):string}
 */
DubStash.functions.ContextualRenderingFunction;


/**
 * @constructor
 */
DubStash.runtime.Context = function(){};
