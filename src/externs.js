/*
	Define some object types that will be passed in to DubStash from other code, and which DubStash
	needs to examine for support of various interfaces. Apart from helping check our code, this
	ensures that next, foreach etc. won't be renamed.
*/


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


// Allow use of module.exports for Node.
var module = {
	exports: {}
};
