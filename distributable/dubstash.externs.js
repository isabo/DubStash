/*
	This file contains 'Extern' definitions that describe DubStash's interface for Google Closure 
	Compiler.
	
	You don't need this unless you want to compile your project with Google Closure Compiler.  
*/

var DubStash = {

	/**
	 * @param {string} text
	 * @return {DubStash.Renderer}
	 */
	compile: function(text){},

	/**
	 * @param {string} text The template text.
	 * @return {string}
	 */
	precompile: function(text){},

	/**
	 * @param {string} name A unique name for the template.
	 * @param {string} text The uncompiled text of the template.
	 */
	registerGlobalTemplate: function(name, text){},

	/**
	 * @return {string}
	 */
	precompileGlobalTemplates: function(){},

	/**
	 * @param {string} name A unique name for the data.
	 * @param {Object|string} data The data object or string.
	 * @expose
	 */
	registerGlobalData: function(name, data){},

	/**
	 * @param {Object} startObj The object that the paths in the template refer to.
	 * @param {string} startPath The path to the start object from the root object.
	 * @param {Object} rootObj The root object. Must contain startObj somewhere in its hierarchy.
	 * @return {Object}
	 */
	'createContext': function(startObj, startPath, rootObj){},


	Runtime: {

		/** 
		 * @param {Array.<function(Object, boolean=):string>} renderers
		 * @param {Object} data
		 * @param {boolean=} opt_ignoreUndefined
		 * @param {Object=} opt_startContext
		 * @return {string}
		 */
		renderTemplate: function(renderers, data, opt_ignoreUndefined, opt_startContext){},

		/**
		 * @param {string} name
		 * @param {boolean} isRecursive
		 * @param {boolean} htmlEscape 
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderPlaceHolderBlock: function(name, isRecursive, htmlEscape, data, ignoreUndefined){},

		/**
		 * @param {string} name
		 * @param {boolean} isRecursive
		 * @param {Array.<function(Object, boolean=):string>} trueRenderers
		 * @param {Array.<function(Object, boolean=):string>} falseRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderConditionBlock: function(name, isRecursive, trueRenderers, falseRenderers, data, ignoreUndefined){},

		/**
		 * @param {string} name
		 * @param {Array.<function(Object, boolean=):string>} subRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderIteratorBlock: function(name, subRenderers, data, ignoreUndefined){},

		/**
		 * @param {string} name A unique name for the template.
		 * @param {function(Object, boolean=, Object=):string} renderer A rendering function.
		 */
		registerGlobalRenderer: function(name, renderer){}
	}
};


/** @typedef {function(Object, boolean=, Object=)} */
DubStash.Renderer;