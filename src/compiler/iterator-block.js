goog.provide('DubStash.compiler.IteratorBlock');

goog.require('DubStash.Runtime');


/**
 * Represents an iterator block to be evaluated at runtime.
 *
 * @param {string} name The name of the collection field to iterate on at runtime.
 * @constructor
 * @implements {DubStash.compiler.Block}
 */
DubStash.compiler.IteratorBlock = function(name){

    /**
     * Name of property to evaluate.
     *
     * @type {string}
     * @private
     */
    this.name_ = name;


    /**
     * Series of blocks to iterate for each value of the property.
     *
     * @type {!Array<Object>}
     * @private
     */
    this.blocks_ = [];
};


/**
 * Returns a function that, when called, will generate the run-time text of the block according
 * to a supplied data object and options.
 *
 * @return {DubStash.ContextualRenderingFunction}
 */
DubStash.compiler.IteratorBlock.prototype.getRenderer = function(){

    // Curry the design-time configuration settings to the runtime rendering function.
    var self = this;
    return /** @type {DubStash.ContextualRenderingFunction} */(function(context, ignoreUndefined){

        return DubStash.Runtime.getInstance().renderIteratorBlock(self.name_,
            self.getSubRenderers_(), context, ignoreUndefined);
    });
};


/**
 * Returns the source code for a function that when called will generate the run-time text of
 * the block according to a supplied data object and options.
 *
 * @return {string}
 */
DubStash.compiler.IteratorBlock.prototype.getRendererSource = function(){

    return [
        'function(c, i){',
        '    var n = "' + this.name_ + '";',
        '    var s = [' + this.getSubRendererSources_().toString() + '];',
        '    return DubStash.I(n, s, c, i);',
        '}'
    ].join('\n');
};


/**
 * Adds a subordinate block during parsing.
 *
 * @param {DubStash.compiler.Block} block
 */
DubStash.compiler.IteratorBlock.prototype.addBlock = function(block){

    this.blocks_.push(block);
};


/**
 * Get an array of rendering functions for the iterable blocks.
 *
 * @return {!Array<DubStash.ContextualRenderingFunction>} Array of rendering functions to call at
 *        runtime.
 * @private
 */
DubStash.compiler.IteratorBlock.prototype.getSubRenderers_ = function(){

    var renderers = [];
    for (var i in this.blocks_){
        renderers.push(this.blocks_[i].getRenderer());
    };

    return renderers;
};


/**
 * Get an array of the sources of rendering functions for the iterable blocks.
 *
 * @return {!Array<string>} Array of sources of rendering functions to call at runtime.
 * @private
 */
DubStash.compiler.IteratorBlock.prototype.getSubRendererSources_ = function(){

    var rendererSources = [];
    for (var i in this.blocks_){
        rendererSources.push(this.blocks_[i].getRendererSource());
    };

    return rendererSources;
};
