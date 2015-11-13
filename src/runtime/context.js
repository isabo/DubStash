goog.provide('DubStash.runtime.Context');


/**
 * Allows the runtime to keep track of which is the current object in the hierarchy, when
 * when drilling down through multi.level.objects.
 *
 * @param {Object} currentObj
 * @param {string} currentPath The path to the current object from the root object.
 * @param {Object} rootObj The root object. Must contain currentObj somewhere in its
 *        hierarchy.
 * @constructor
 */
DubStash.runtime.Context = function(currentObj, currentPath, rootObj){

    /** @type {Object} */
    this.currentObj = currentObj;

    /** @type {string} */
    this.currentPath = currentPath;

    /** @type {Object} */
    this.rootObj = rootObj;
};
