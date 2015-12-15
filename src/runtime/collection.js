goog.provide('DubStash.runtime.Collection');


/** @interface */
var Collection_ = function(){};

/** @param {function(Object)} callback */
Collection_.prototype.forEach = function(callback){};

/** @type {Iterator} */
Collection_.prototype.__iterator__;

/** @type {number} */
Collection_.prototype.length;

/** @typedef {Collection_|Array|Object} */
DubStash.runtime.Collection;
