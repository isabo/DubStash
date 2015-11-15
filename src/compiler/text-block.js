goog.provide('DubStash.compiler.TextBlock');


/**
 * Represents a block of static text discovered by the compiler.
 *
 * @param {string} text The static text.
 * @constructor
 * @implements {DubStash.compiler.Block}
 */
DubStash.compiler.TextBlock = function(text){

    /**
     * @type {string}
     * @private
     */
    this.text_ = text;
};


/**
 * Returns a function that when called will generate the run-time text of the block according to
 * a supplied data object and options.
 *
 * @return {DubStash.ContextualRenderingFunction}
 */
DubStash.compiler.TextBlock.prototype.getRenderer = function(){

    var self = this;
    return function(){
        return self.text_;
    };
};


/**
 * Returns the source code for a function that when called will generate the run-time text of
 * the block according to a supplied data object and options.
 *
 * @return {string}
 */
DubStash.compiler.TextBlock.prototype.getRendererSource = function(){

    // Return a function with the value of this.text_ frozen into it, because serialized
    // functions lose their scope variables.
    return [
        'function(){',
        '    return "' + this.escapedText() + '";',
        '}'
    ].join('\n');
};


/**
 * Regular expression for finding quotes.
 */
DubStash.compiler.TextBlock.RE_DOUBLE_QUOTES = /"/g;


/**
 * Regular expression for finding line-breaks.
 */
DubStash.compiler.TextBlock.RE_NEWLINE = /\r?\n/g;


/**
 * Regular expression for finding backslashes.
 */
DubStash.compiler.TextBlock.RE_BACKSLASH = /\\/g;


/**
 * Used by precompiler. Makes text safe for inclusion in precompiled JavaScript. That means
 * escaping any double quotes.
 *
 * @return {string}
 * @protected
 */
DubStash.compiler.TextBlock.prototype.escapedText = function(){

    return this.text_.replace(DubStash.compiler.TextBlock.RE_BACKSLASH, '\\\\').
                      replace(DubStash.compiler.TextBlock.RE_DOUBLE_QUOTES, '\\"').
                      replace(DubStash.compiler.TextBlock.RE_NEWLINE, '\\n');
};


/**
 * For compatibility with the Block interface.
 *
 * @param {!DubStash.compiler.Block} block
 */
DubStash.compiler.TextBlock.prototype.addBlock = function(block){};
