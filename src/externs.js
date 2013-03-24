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


// Allow use of console without the 'window.' prefix, which doesn't work in Node.
var console = {
	/** @param {...*} var_args */
	log: function(var_args){}
};

// Allow use of module.exports for Node.
var module = {
	exports: {}
};

