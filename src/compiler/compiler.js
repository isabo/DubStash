goog.provide('DubStash.compiler.Compiler');

goog.require('DubStash.runtime.Runtime');
goog.require('DubStash.compiler.TextBlock');
goog.require('DubStash.compiler.ConditionBlock');
goog.require('DubStash.compiler.IteratorBlock');
goog.require('DubStash.compiler.PlaceholderBlock');


/**
 * Compiler - knows how to compile a template into a rendering function.
 *
 * The approach is to break down the text into a series of building blocks, some of which may
 * contain other blocks. Each block can be called upon to render itself using provided input.
 * In addition, each block knows how to write out the source code for a Javascript function that
 * does the same.
 *
 * @param {string} text The template.
 * @constructor
 */
DubStash.compiler.Compiler = function(text){

    /**
     * The source text of the template that is being compiled.
     *
     * @type {string}
     * @private
     */
    this.text_ = text;


    /**
     * A stack of the hierarchy of blocks currently being analyzed. Once the end of a block is
     * reached, it is "closed".
     *
     * @type {Array<!DubStash.compiler.Block>}
     * @private
     */
    this.openBlocks_ = [];


    /**
     * Keep track of the position of the last matched regular expression.
     *
     * @type {number}
     * @private
     */
    this.lastIndex_ = 0;


    /**
     * The series of blocks that make up the template.
     *
     * @type {Array<!DubStash.compiler.Block>}
     * @private
     */
    this.topLevelBlocks_ = [];
};


/**
 * Parses the template and returns a function that will render it.
 *
 * @return {DubStash.functions.ExternalRenderingFunction} Where the params are Object: run-time data
 * object whose fields will be substituted into the placeholders, or tested by conditions, and
 * boolean: whether to ignore placeholders whose value is undefined (default: don't ignore, i.e.
 * replace with nothing).
 */
DubStash.compiler.Compiler.prototype.getRenderer = function(){

    // Parse the template into blocks.
    this.compile_();

    // Ask each block to generate a rendering function.
    var renderers = this.getTopLevelRenderers_();

    // Return a function that calls the block rendering functions and strings together the
    // results. Partially bind the runtime function to the rendering functions generated using
    // design time configuration settings.
    return /** @type {DubStash.functions.ExternalRenderingFunction} */(function(data,
            opt_ignoreUndefined, startContext){

        return DubStash.runtime.Runtime.getInstance().renderTemplate(renderers, data,
            opt_ignoreUndefined, startContext);
    });
};


/**
 * Parses the template and returns the source code of a function that will render it. This can
 * then be saved into a .js file -- i.e. precompilation.
 *
 * @return {string}
 */
DubStash.compiler.Compiler.prototype.getRendererSource = function(){

    // Compile if necessary.
    this.compile_();

    // Ask each block to generate the source of a rendering function.
    var rendererSources = this.getTopLevelRendererSources_();

    // Return a function that calls the block rendering functions and strings together the
    // results.
    return [
        'function(d, i, s){',
        '    var r = [' + rendererSources.toString() + '];',
        '    return DubStash.T(r, d, i, s);',
        '}'
    ].join('\n');
};


/**
 * Create an array of rendering functions generated by the top-level blocks.
 *
 * @return {!Array<DubStash.functions.ContextualRenderingFunction>}
 * @private
 */
DubStash.compiler.Compiler.prototype.getTopLevelRenderers_ = function(){

    // Create an array containing each block's rendering function.
    var renderers = [];
    for (var i in this.topLevelBlocks_){
        renderers.push(this.topLevelBlocks_[i].getRenderer());
    };
    return renderers;
};


/**
 * Create an array of sources of rendering functions generated by the top-level blocks.
 *
 * @return {!Array<string>}
 * @private
 */
DubStash.compiler.Compiler.prototype.getTopLevelRendererSources_ = function(){

    // Create an array containing each block's rendering function.
    var rendererSources = [];
    for (var i in this.topLevelBlocks_){
        rendererSources.push(this.topLevelBlocks_[i].getRendererSource());
    };
    return rendererSources;
};


/**
 * Parses the template into a block/tree structure.
 *
 * @private
 */
DubStash.compiler.Compiler.prototype.compile_ = function(){

    // Reset our regexp just in case it was left in an unpredictable state by an incomplete
    // parsing operation.
    DubStash.compiler.Compiler.PATTERN.lastIndex = 0;

    // Loop through the occurrences of {{...}}
    var match;
    while ((match = DubStash.compiler.Compiler.PATTERN.exec(this.text_)) !== null){

        if (match[1].length === match[5].length){
            // The brackets are balanced.

            var isRecursive, block, unexpected;

            // Anything between the last {{...}} (or the beginning) and this {{...}} is a text
            // block.
            this.addTextBlock_(match);

            // Now handle the {{...}} we just found.
            switch (match[2]){

                case 'if':

                    if (match[3]){
                        // We have the beginning of a condition, e.g.: {{if x}}
                        isRecursive = (match[4] === '/r');
                        block = new DubStash.compiler.ConditionBlock(match[3], isRecursive);
                        this.addBlock_(block);
                        this.openBlocks_.push(block);

                    } else {
                        // Bad 'if' statement. Log it and move on.
                        console.log('Bad condition: ' + match[0]);
                    };
                    break;


                case 'foreach':

                    if (match[3]){
                        // We have a name of a collection to iterate on, e.g. {{foreach people}}
                        block = new DubStash.compiler.IteratorBlock(match[3]);
                        this.addBlock_(block);
                        this.openBlocks_.push(block);
                    };
                    break;


                case 'else':

                    // The last open block should be a condition. Tell it that an {{else}} has
                    // been found.
                    unexpected = false;
                    if (this.openBlocks_.length){

                        var lastBlock = this.openBlocks_[this.openBlocks_.length - 1];
                        if (lastBlock instanceof DubStash.compiler.ConditionBlock){
                            lastBlock.foundElse();
                        } else {
                            unexpected = true;
                        };

                    } else {
                        unexpected = true;
                    };

                    if (unexpected){
                        // An else outside an if?!
                        // Put it back in the output to show the problem.
                        this.addTextBlock_(match[0]);
                        console.log('Unexpected {{else}} encountered!');
                    };

                    break;


                case 'end':

                    // End the last open block
                    unexpected = false;
                    if (this.openBlocks_.length){

                        // If the type of block that is supposed to be closing is specified,
                        // verify that it is closing the correct block.
                        if (match[3]){

                            lastBlock = this.openBlocks_[this.openBlocks_.length - 1];

                            if (match[3] === 'if'){
                                unexpected =
                                    !(lastBlock instanceof DubStash.compiler.ConditionBlock);
                            } else if (match[3] === 'foreach'){
                                unexpected =
                                    !(lastBlock instanceof DubStash.compiler.IteratorBlock);
                            } else {
                                unexpected = true;
                            };
                        };

                    } else {
                        unexpected = true;
                    };

                    if (!unexpected){
                        // Condition is complete: remove it from the stack.
                        this.openBlocks_.pop();
                    } else {
                        // Found the end of a block when none are open? Wrong type of end?
                        // Put it back in the output to show the problem.
                        this.addTextBlock_(match[0]);
                        console.log('Unexpected {{end}} encountered!');
                    };
                    break;


                default:
                    // A regular placeholder.
                    var htmlEscape = (match[1].length === 2);
                    isRecursive = (match[3] === '/r');
                    block =
                        new DubStash.compiler.PlaceholderBlock(match[2], isRecursive, htmlEscape);
                    this.addBlock_(block);
            };

        } else {

            // Brackets are not balanced: ignore and continue.
            console.log('Unbalanced brackets encountered: ' + match[0]);
        };
    };

    // Add the text between the last {{...}} and the end.
    // Use a fake match.
    match = [];
    match.index = this.text_.length;
    this.addTextBlock_(match);

    if (this.openBlocks_.length){
        console.log('Missing {{end}}!');
    };

    // this.topLevelBlocks_ now contains all the info needed in order to render.
};


/**
 * Adds everything between the last {{...}} (or the beginning) and the current {{...}} as a text
 * block.
 *
 * @param {!Array|string} match
 * @private
 */
DubStash.compiler.Compiler.prototype.addTextBlock_ = function(match){

    var str = (typeof match === 'string') ?
        match : this.text_.slice(this.lastIndex_, match.index);

    if (str.length){
        var block = new DubStash.compiler.TextBlock(str);
        this.addBlock_(block);
    } else {
        this.lastIndex_ = DubStash.compiler.Compiler.PATTERN.lastIndex;
    };
};


/**
 * Adds a new block to the tree.
 *
 * @param {!DubStash.compiler.Block} block
 * @private
 */
DubStash.compiler.Compiler.prototype.addBlock_ = function(block){

    if (this.openBlocks_.length){
        // It is subordinate to a condition or iterator.
        this.openBlocks_[this.openBlocks_.length - 1].addBlock(block);
    } else {
        // It is at the top level.
        this.topLevelBlocks_.push(block);
    };

    this.lastIndex_ = DubStash.compiler.Compiler.PATTERN.lastIndex;
};


/**
 * The regular expression that parses out the {{...}}
 *
 * @const
 * @type {RegExp}
 */
DubStash.compiler.Compiler.PATTERN = /(\{{2,3})\s*([^\}\s]*)\s*([^\}\s]*)?\s*([^\}\s]*)?(\}{2,3})/g;
