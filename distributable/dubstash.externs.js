/*
	This file contains 'Extern' definitions that describe DubStash's interface for Google Closure 
	Compiler.
	
	You don't need this unless you want to compile your project with Google Closure Compiler.  
*/

var DubStash = {

	/**
	 * @param {string} text
	 * @return {function(Object, boolean=):string}
	 */
	compile: function(text){},

	/**
	 * @param {string} text The template text.
	 * @return {string}
	 */
	precompile: function(text){},


	Runtime: {

		/** 
		 * @param {Array.<function(Object, boolean=):string>} renderers
		 * @param {Object} data
		 * @param {boolean=} opt_ignoreUndefined
		 * @return {string}
		 */
		renderTemplate: function(renderers, data, opt_ignoreUndefined){},

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
		 * @param {Array.<function(Object, boolean=):string>} trueRenderers
		 * @param {Array.<function(Object, boolean=):string>} falseRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderConditionBlock: function(name, trueRenderers, falseRenderers, data, ignoreUndefined){},

		/**
		 * @param {string} name
		 * @param {Array.<function(Object, boolean=):string>} subRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderIteratorBlock: function(name, subRenderers, data, ignoreUndefined){}
	}
};


/**
 * Type of object that can be used with {{foreach}}.
 *
 * @interface
 */
DubStash.Iterable_ = function(){};

/** @param {function(Object)} callback */
DubStash.Iterable_.prototype.forEach = function(callback){};

/** @type {{next: function():Object}} */
DubStash.Iterable_.prototype.__iterator__;

/** @type {number} */
DubStash.Iterable_.prototype.length;

/** @typedef {DubStash.Iterable_|Array|Object} */
DubStash.Iterable;