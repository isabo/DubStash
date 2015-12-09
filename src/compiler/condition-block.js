goog.provide('DubStash.compiler.ConditionBlock');

goog.require('DubStash.runtime.Runtime');


/**
 * Represents a condition block to be evaluated at runtime.
 *
 * @param {string} name The name of the field to evaluate up at runtime.
 * @param {boolean} isRecursive Whether to treat the resulting value as a template and evaluate
 *        that.
 * @constructor
 * @implements {DubStash.compiler.Block}
 */
DubStash.compiler.ConditionBlock = function(name, isRecursive){

    /**
     * Name of property to evaluate.
     *
     * @type {string}
     * @private
     */
    this.name_ = name;


    /**
     * Whether to evaluate the property recursively.
     *
     * @type {boolean}
     * @private
     */
    this.isRecursive_ = isRecursive;


    /**
     * Whether an {{else}} token has been encountered yet,
     *
     * @type {boolean}
     * @private
     */
    this.foundElse_ = false;


    /**
     * Series of blocks that apply when the property is truthy.
     *
     * @type {!Array<!DubStash.compiler.Block>}
     * @private
     */
    this.trueBlocks_ = [];


    /**
     * Series of blocks that apply when the property is falsy.
     *
     * @type {!Array<!DubStash.compiler.Block>}
     * @private
     */
    this.falseBlocks_ = [];
};


/**
 * Tell the block that its {{else}} has been encountered. Any subsequent blocks encountered
 * will be 'false' blocks -- blocks to use if the condition evaluates to false.
 */
DubStash.compiler.ConditionBlock.prototype.foundElse = function(){

    this.foundElse_ = true;
};


/**
 * Adds a subordinate block.
 *
 * @param {!DubStash.compiler.Block} block
 */
    DubStash.compiler.ConditionBlock.prototype.addBlock = function(block){

    var blocks = this.foundElse_ ? this.falseBlocks_ : this.trueBlocks_;
    blocks.push(block);
};


/**
 * Returns a function that, when called, will generate the run-time text of the block according
 * to a supplied data object and options.
 *
 * @return {DubStash.functions.ContextualRenderingFunction}
 */
DubStash.compiler.ConditionBlock.prototype.getRenderer = function(){

    // Curry the design-time configuration settings into the runtime rendering function.
    var name = this.name_;
    var isRecursive = this.isRecursive_;
    var trueRenderers = this.getSubRenderers_(this.trueBlocks_);
    var falseRenderers = this.getSubRenderers_(this.falseBlocks_);

    return /** @type {DubStash.functions.ContextualRenderingFunction} */(function(context,
            ignoreUndefined){

        return DubStash.runtime.Runtime.getInstance().renderConditionBlock(name, isRecursive,
            trueRenderers, falseRenderers, context, ignoreUndefined);
    });
};


/**
 * Returns the source code for a function that when called will generate the run-time text of
 * the block according to a supplied data object and options.
 *
 * @return {string}
 */
DubStash.compiler.ConditionBlock.prototype.getRendererSource = function(){

    return [
        'function(c, i){',
        '    var n = "' + this.name_ + '";',
        '    var r = ' + this.isRecursive_ + ';',
        '    var t = [' + this.getSubRendererSources_(this.trueBlocks_).toString() + '];',
        '    var f = [' + this.getSubRendererSources_(this.falseBlocks_).toString() + '];',
        '    return DubStash.C(n, r, t, f, c, i);',
        '}'
    ].join('\n');
};


/**
 * Get an array of rendering functions for trueBlocks or falseBlocks.
 *
 * @param {!Array<!DubStash.compiler.Block>} blocks Either trueBlocks or falseBlocks.
 * @return {!Array<DubStash.functions.ContextualRenderingFunction>} Array of rendering functions to
 *        call at runtime.
 * @private
 */
DubStash.compiler.ConditionBlock.prototype.getSubRenderers_ = function(blocks){

    var renderers = [];
    for (var i in blocks){
        renderers.push(blocks[i].getRenderer());
    };

    return renderers;
};


/**
 * Get an array of the sources of rendering functions for trueBlocks or falseBlocks.
 *
 * @param {!Array<!DubStash.compiler.Block>} blocks Either trueBlocks or falseBlocks.
 * @return {!Array<string>} Array of sources of rendering functions to call at runtime.
 * @private
 */
DubStash.compiler.ConditionBlock.prototype.getSubRendererSources_ = function(blocks){

    var rendererSources = [];
    for (var i in blocks){
        rendererSources.push(blocks[i].getRendererSource());
    };

    return rendererSources;
};
