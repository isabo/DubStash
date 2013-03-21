/*
	Define some object types that will be passed in to DubStep from other code, and which DubStep
	needs to examine for support of various interfaces. Apart from helping check our code, this 
	ensures that next, foreach etc. won't be renamed.
*/

/** @interface */
var Iterator = function(){};

/** @return {Object} */
Iterator.prototype.next = function(){};


/** @interface */
var Collection_ = function(){};

/** @param {function(Object)} callback */
Collection_.prototype.forEach = function(callback){};

/** @type {Iterator} */
Collection_.prototype.__iterator__;

/** @type {number} */
Collection_.prototype.length;

/** @typedef {Collection_|Array|Object} */
var Collection;


/*
 The following are not an external objects. The typedefs below are for enforcing type/param 
 definitions only, without having to declare the typpedefs in dubstash.js, where they would have 
 to be outside the closure, as that's the only place typedefs seem to be supported.
*/

/** @typedef {{currentObj: Object, currentPath: string, rootObj: Object}} */
var Context;

/** @typedef {function(Context, boolean=):string} */
var Renderer;
