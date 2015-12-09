goog.provide('DubStash.compiler.Block');


/**
 * A template is made up of blocks, each of which has a distinct function. This is the standard
 * interface for these blocks.
 *
 * @param {...(string|boolean)} var_args
 * @interface
 */
DubStash.compiler.Block = function(var_args){};


/**
 * Returns a function that, when called, will generate the run-time text of the block according
 * to a supplied data object and options.
 *
 * @return {DubStash.functions.ContextualRenderingFunction}
 */
DubStash.compiler.Block.prototype.getRenderer = function(){};


/**
 * Returns the source code for a function that when called will generate the run-time text of
 * the block according to a supplied data object and options.
 *
 * @return {string}
 */
DubStash.compiler.Block.prototype.getRendererSource = function(){};


/**
 * Adds a subordinate block during parsing.
 *
 * @param {!DubStash.compiler.Block} block
 */
DubStash.compiler.Block.prototype.addBlock = function(block){};
