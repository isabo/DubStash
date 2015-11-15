goog.provide('DubStash.compiler.PlaceholderBlock');

goog.require('DubStash.Runtime');


/**
 * Represents a placeholder to be replaced with data at runtime. Discovered by the compiler.
 *
 * @param {string} name The name of the field to look up at runtime.
 * @param {boolean} isRecursive Whether to treat the resulting value as a template and process
 *        that.
 * @param {boolean} htmlEscape Whether to escape the runtime value to make it safe for inclusion
 *         in HTML.
 * @constructor
 * @implements {DubStash.compiler.Block}
 */
DubStash.compiler.PlaceholderBlock = function(name, isRecursive, htmlEscape){

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
     * Whether to escape the results to make them safe to include in HTML.
     *
     * @type {boolean}
     * @private
     */
    this.htmlEscape_ = htmlEscape;
};


/**
 * Returns a function that when called will generate the run-time text of the block according to
 * a supplied data object and options.
 *
 * @return {DubStash.ContextualRenderingFunction}
 */
DubStash.compiler.PlaceholderBlock.prototype.getRenderer = function(){

    // Curry the design-time configuration settings into the runtime rendering function.
    var self = this;
    return /** @type {DubStash.ContextualRenderingFunction} */(function(context, ignoreUndefined){

        return DubStash.Runtime.getInstance().renderPlaceHolderBlock(self.name_, self.isRecursive_,
            self.htmlEscape_, context, ignoreUndefined);
    });
};


/**
 * Returns the source code for a function that when called will generate the run-time text of
 * the block according to a supplied data object and options.
 *
 * @return {string}
 */
DubStash.compiler.PlaceholderBlock.prototype.getRendererSource = function(){

    // We would like to partially bind the runtime block renderer function with design-time
    // params, but because we will serialize the function to text, it will lose its scope
    // variables - i.e. the binding will be worthless. We therefore have to freeze the values of
    // the design-time variables into the function.
    return [
        'function(c, i){',
        '    return DubStash.P(' +
                ['"' + this.name_ + '"', this.isRecursive_, this.htmlEscape_].join(', ') +
                ', c, i);',
        '}'
    ].join('\n');
};


/**
 * Adds a subordinFor compatibility with the Block interface.
 *
 * @param {DubStash.compiler.Block} block
 */
DubStash.compiler.PlaceholderBlock.prototype.addBlock = function(block){};
