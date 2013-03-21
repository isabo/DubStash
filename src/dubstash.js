/*

The MIT License (MIT) 

Copyright (c) 2013 Itzy Sabo

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function(){

	/**
	 * This is the public interface to the library. The method names are quoted to prevent Google 
	 * Closure from renaming them.
	 */
	var DubStash = {
	
		'VERSION': '1.0.0.rc1',

		/**
		 * Get a function that when called writes out the template while performing the necessary 
		 * substitutions.
		 *
		 * @param {string} text The template text.
		 * @return {function(Object, boolean=):string}
		 * Where the params of the returned function are:
		 * 	{Object} data An object whose fields will be substituted into the placeholders, or  
		 *		tested by conditions.
		 *	{boolean=} opt_ignoreUndefined Whether to leave alone placeholders whose value is  
		 *		undefined or to replace them with nothing (default: replace with nothing).
		 */
		'compile': function(text){

			var compiler = new Compiler(text);
			return compiler.getRenderer();
		},


		/**
		 * Get the source of a function that when called writes out the template while performing  
		 * the necessary substitutions. The source can then be saved and used instead of the 
		 * template.
		 *
		 * @param {string} text The template text.
		 * @return {string}
		 * Where the params of the returned function are:
		 * 	{Object} data An object whose fields will be substituted into the placeholders, or 
		 *		tested by conditions.
		 *	{boolean=} opt_ignoreUndefined Whether to leave alone placeholders whose value is 
		 *		undefined or to replace them with nothing (default: replace with nothing).
		 */
		'precompile': function(text){

			var compiler = new Compiler(text);
			return compiler.getRendererSource();
		}
	};




	/**
	 * Compiler - knows how to compile a template into a rendering function.
	 *
	 * @param {string} text The template.
	 * @constructor
	 */
	var Compiler = function(text){

		/**
		 * @type {string}
		 * @private
		 */
		this.text_ = text;

		/**
		 * @type {boolean}
		 * @private
		 */
		this.isCompiled_ = false;

		/**
		 * @type {Array.<Object>}
		 * @private
		 */
		this.openBlocks_ = [];

		/**
		 * @type {number}
		 * @private
		 */
		this.lastIndex_ = 0;

		/**
		 * @type {Array.<Object>}
		 * @private
		 */
		this.topLevelBlocks_ = [];
	};


	/**
	 * Parses the template and returns a function that will render it.
	 *
	 * @return {function(Object, boolean=):string} Where the params are Object: run-time data object 
	 * whose fields will be substituted into the placeholders, or tested by conditions, and boolean:
	 * whether to ignore placeholders whose value is undefined (default: don't ignore, i.e. replace
	 * with nothing).
	 */
	Compiler.prototype.getRenderer = function(){

		// Compile if necessary.
		this.compile_();

		// Ask each block to generate a rendering function.
		var renderers = this.getTopLevelRenderers_();

		// Return a function that calls the block rendering functions and strings together the 
		// results. Partially bind the runtime function to the rendering functions generated using 
		// design time configuration settings.
		return /** @type {function(Object, boolean=):string}*/(function (data, opt_ignoreUndefined){

			return Runtime.renderTemplate(renderers, data, opt_ignoreUndefined);
		});
	};


	/**
	 * Parses the template and returns the source code of a function that will render it. This can 
	 * then be saved into a .js file -- i.e. precompilation.
	 *
	 * @return {string}
	 */
	Compiler.prototype.getRendererSource = function(){

		// Compile if necessary.
		this.compile_();

		// Ask each block to generate the source of a rendering function.
		var rendererSources = this.getTopLevelRendererSources_();

		// Return a function that calls the block rendering functions and strings together the
		// results.
		return [
			'function(d, i){',
			'	var r = [' + rendererSources.toString() + '];',
			'	return DubStash.Runtime.renderTemplate(r, d, i);',
			'}'
		].join('\n');
	};


	/**
	 * Create an array of rendering functions generated by the top-level blocks.
	 * 
	 * @return {!Array.<function(Object, boolean):string>}
	 * @private
	 */
	Compiler.prototype.getTopLevelRenderers_ = function(){

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
	 * @return {!Array.<string>}
	 * @private
	 */
	Compiler.prototype.getTopLevelRendererSources_ = function(){

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
	Compiler.prototype.compile_ = function(){

		if (this.isCompiled_){
			return;
		};

		// Reset our regexp just in case it was left in an unpredictable state by an incomplete 
		// parsing operation.
		Compiler.PATTERN.lastIndex = 0;

		// Loop through the occurrences of {{...}} 
		var match;
		while ((match = Compiler.PATTERN.exec(this.text_)) !== null){

			if (match[1].length === match[4].length){
				// The brackets are balanced.

				var block, unexpected;
				
				// Anything between the last {{...}} (or the beginning) and this {{...}} is a text 
				// block.
				this.addTextBlock_(match);

				// Now handle the {{...}} we just found.
				switch (match[2]){

					case 'if':

						if (match[3]){
							// We have the beginning of a condition, e.g.: {{if x}}
							block = new ConditionBlock(match[3]);
							this.addBlock_(block);
							this.openBlocks_.push(block);

						} else {
							// Bad 'if' statement. Log it and move on.
							Console.log('Bad condition: ' + match[0]);
						};
						break;


					case 'foreach':

						if (match[3]){
							// We have a name of a collection to iterate on, e.g. {{foreach people}}
							block = new IteratorBlock(match[3]);
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
							if (lastBlock instanceof ConditionBlock){
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
							Console.log('Unexpected {{else}} encountered!');	
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
									unexpected = !(lastBlock instanceof ConditionBlock);
								} else if (match[3] === 'foreach'){
									unexpected = !(lastBlock instanceof IteratorBlock);
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
							Console.log('Unexpected {{end}} encountered!');
						};
						break;


					default:
						// A regular placeholder.
						var htmlEscape = (match[1].length === 2);
						var isRecursive = (match[3] === '/r');
						block = new PlaceholderBlock(match[2], isRecursive, htmlEscape);
						this.addBlock_(block);					
				};

			} else {

				// Brackets are not balanced: ignore and continue.
				Console.log('Unbalanced brackets encountered: ' + match[0]);
			};
		};

		// Add the text between the last {{...}} and the end.
		// Use a fake match.
		match = [];
		match.index = this.text_.length;
		this.addTextBlock_(match);

		if (this.openBlocks_.length){
			Console.log('Missing {{end}}!');
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
	Compiler.prototype.addTextBlock_ = function(match){

		var str = (typeof match === 'string') ? 
			match : this.text_.slice(this.lastIndex_, match.index);

		if (str.length){
			var block = new TextBlock(str);
			this.addBlock_(block);
		} else {
			this.lastIndex_ = Compiler.PATTERN.lastIndex;		
		};
	};


	/**
	 * Adds a new block to the tree.
	 *
	 * @param {Object} block
	 * @private
	 */
	Compiler.prototype.addBlock_ = function(block){

		if (this.openBlocks_.length){
			// It is subordinate to a condition or iterator.
			this.openBlocks_[this.openBlocks_.length - 1].addBlock(block);
		} else {
			// It is at the top level.
			this.topLevelBlocks_.push(block);
		};

		this.lastIndex_ = Compiler.PATTERN.lastIndex;
	};


	/**
	 * The regular expression that parses out the {{...}}
	 *
	 * @const
	 * @type {RegExp}
	 */
	Compiler.PATTERN = /({{2,3})\s*([^}\s]+)\s*([^}]*)?(}{2,3})/g;




	/**
	 * Represents a block of static text discovered by the compiler.
	 *
	 * @param {string} text The static text.
	 * @constructor
	 */
	var TextBlock = function(text){

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
	 * @return {function(Object, boolean):string}
	 */
	TextBlock.prototype.getRenderer = function(){

		var text = this.text_;
		return function(){
			return text;
		};
	};


	/**
	 * Returns the source code for a function that when called will generate the run-time text of  
	 * the block according to a supplied data object and options.
	 *
	 * @return {string} 
	 */
	TextBlock.prototype.getRendererSource = function(){

		// Return a function with the value of this.text_ frozen into it, because serialized 
		// functions lose their scope variables.
		return [
			'function(){',
			'	return "' + this.jsEscape(this.text_) + '";',
			'}'
		].join('\n');
	};


	/**
	 * Regular expression for finding quotes.
	 */
	TextBlock.RE_DOUBLE_QUOTES = /"/g;


	/**
	 * Regular expression for finding line-breaks.
	 */
	TextBlock.RE_NEWLINE = /\r?\n/g;


	/**
	 * Regular expression for finding backslashes.
	 */
	TextBlock.RE_BACKSLASH = /\\/g;


	/**
	 * Used by precompiler. Makes text safe for inclusion in precompiled JavaScript. That means 
	 * escaping any double quotes.
	 *
	 * @param {string} text
	 * @return {string}
	 * @protected
	 */
	TextBlock.prototype.jsEscape = function(text){

		return text.replace(TextBlock.RE_BACKSLASH, '\\\\').
					replace(TextBlock.RE_DOUBLE_QUOTES, '\\"').
					replace(TextBlock.RE_NEWLINE, '\\n');
	};




	/**
	 * Represents a placeholder to be replaced with data at runtime. Discovered by the compiler.
	 *
	 * @param {string} name The name of the field to look up at runtime.
	 * @param {boolean} isRecursive Whether to treat the resulting value as a template and process 
	 *		that.
	 * @param {boolean} htmlEscape Whether to escape the runtime value to make it safe for inclusion
	 * 		in HTML.
	 * @constructor
	 */
	var PlaceholderBlock = function(name, isRecursive, htmlEscape){

		/**
		 * @type {string}
		 * @private
		 */
		this.name_ = name;

		/**
		 * @type {boolean}
		 * @private
		 */
		this.isRecursive_ = isRecursive;

		/**
		 * @type {boolean}
		 * @private
		 */
		this.htmlEscape_ = htmlEscape;
	};


	/**
	 * Returns a function that when called will generate the run-time text of the block according to
	 * a supplied data object and options.
	 *
	 * @return {function(Object, boolean):string}
	 */
	PlaceholderBlock.prototype.getRenderer = function(){

		// Bind the design-time configuration settings to the runtime rendering function.
		var self = this;
		return function(data, ignoreUndefined){

			return Runtime.renderPlaceHolderBlock(self.name_, self.isRecursive_, 
				self.htmlEscape_, data, ignoreUndefined);
		};
	};


	/**
	 * Returns the source code for a function that when called will generate the run-time text of 
	 * the block according to a supplied data object and options.
	 *
	 * @return {string} 
	 */
	PlaceholderBlock.prototype.getRendererSource = function(){

		// We would like to partially bind the runtime block renderer function with design-time
		// params, but because we will serialize the function to text, it will lose its scope 
		// variables - i.e. the binding will be worthless. We therefore have to freeze the values of
		// the design-time variables into the function.
		return [
			'function(d, i){',
			'	return DubStash.Runtime.renderPlaceHolderBlock(' +
					['"' + this.name_ + '"', this.isRecursive_, this.htmlEscape_].join(', ') + 
					', d, i);',

			'}'
		].join('\n');
	};




	/**
	 * Represents a condition block to be evaluated at runtime.
	 *
	 * @param {string} name The name of the field to evaluate up at runtime.
	 * @constructor
	 */
	var ConditionBlock = function(name){

		/**
		 * @type {string}
		 * @private
		 */
		this.name_ = name;

		/**
		 * @type {boolean}
		 * @private
		 */
		this.foundElse_ = false;

		/**
		 * @type {!Array.<Object>}
		 * @private
		 */
		this.trueBlocks_ = [];
		
		/**
		 * @type {!Array.<Object>}
		 * @private
		 */
		this.falseBlocks_ = [];
	};


	/**
	 * Tell the block that its {{else}} has been encountered. Any subordinate blocks encountered 
	 * will be 'false' blocks -- blocks to use if the condition evaluates to false.
	 */
	ConditionBlock.prototype.foundElse = function(){

		this.foundElse_ = true;
	};


	/** 
	 * Adds a subordinate block.
	 *
	 * @param {Object} block
	 */
	ConditionBlock.prototype.addBlock = function(block){

		var blocks = this.foundElse_ ? this.falseBlocks_ : this.trueBlocks_; 
		blocks.push(block);
	};


	/**
	 * Returns a function that when called will generate the run-time text of the block according to
	 * a supplied data object and options.
	 *
	 * @return {function(Object, boolean):string}
	 */
	ConditionBlock.prototype.getRenderer = function(){

		// Bind the design-time configuration settings to the runtime rendering function.
		var name = this.name_;
		var trueRenderers = this.getSubRenderers_(this.trueBlocks_);
		var falseRenderers = this.getSubRenderers_(this.falseBlocks_);

		return function(data, ignoreUndefined){

			return Runtime.renderConditionBlock(name, trueRenderers, falseRenderers, data, 
				ignoreUndefined);
		};
	};


	/**
	 * Returns the source code for a function that when called will generate the run-time text of 
	 * the block according to a supplied data object and options.
	 *
	 * @return {string} 
	 */
	ConditionBlock.prototype.getRendererSource = function(){

		return [
			'function(d, i){',
			'	var n = "' + this.name_ + '";',
			'	var t = [' + this.getSubRendererSources_(this.trueBlocks_).toString() + '];',
			'	var f = [' + this.getSubRendererSources_(this.falseBlocks_).toString() + '];',
			'	return DubStash.Runtime.renderConditionBlock(n, t, f, d, i);',
			'}'
		].join('\n');
	};


	/**
	 * Get an array of rendering functions for trueBlocks or falseBlocks.
	 * 
	 * @param {!Array.<Object>} blocks Either trueBlocks or falseBlocks.
	 * @return {!Array.<function(Object, boolean):string>} Array of rendering functions to call at 
	 *		runtime.
	 * @private
	 */
	ConditionBlock.prototype.getSubRenderers_ = function(blocks){

		var renderers = [];
		for (var i in blocks){
			renderers.push(blocks[i].getRenderer());
		};

		return renderers;
	};


	/**
	 * Get an array of the sources of rendering functions for trueBlocks or falseBlocks.
	 * 
	 * @param {!Array.<Object>} blocks Either trueBlocks or falseBlocks.
	 * @return {!Array.<string>} Array of sources of rendering functions to call at runtime.
	 * @private
	 */
	ConditionBlock.prototype.getSubRendererSources_ = function(blocks){

		var rendererSources = [];
		for (var i in blocks){
			rendererSources.push(blocks[i].getRendererSource());
		};

		return rendererSources;
	};




	/**
	 * Represents an iterator block to be evaluated at runtime.
	 *
	 * @param {string} name The name of the collection field to iterate on at runtime.
	 * @constructor
	 */
	var IteratorBlock = function(name){

		/**
		 * @type {string}
		 * @private
		 */
		this.name_ = name;

		/**
		 * @type {!Array.<Object>}
		 * @private
		 */
		this.blocks_ = [];
	};


	/**
	 * Returns a function that when called will generate the run-time text of the block according to
	 * a supplied data object and options.
	 *
	 * @return {function(Object, boolean):string}
	 */
	IteratorBlock.prototype.getRenderer = function(){

		// Bind the design-time configuration settings to the runtime rendering function.
		var self = this;
		return function(data, ignoreUndefined){

			return Runtime.renderIteratorBlock(self.name_, self.getSubRenderers_(),	data, 
				ignoreUndefined);
		};
	};


	/**
	 * Returns the source code for a function that when called will generate the run-time text of  
	 * the block according to a supplied data object and options.
	 *
	 * @return {string} 
	 */
	IteratorBlock.prototype.getRendererSource = function(){

		return [
			'function(d, i){',
			'	var n = "' + this.name_ + '";',
			'	var s = [' + this.getSubRendererSources_().toString() + '];',
			'	return DubStash.Runtime.renderIteratorBlock(n, s, d, i);',
			'}'
		].join('\n');
	};

	
	/** 
	 * Adds a subordinate block during parsing.
	 *
	 * @param {Object} block
	 */
	IteratorBlock.prototype.addBlock = function(block){

		this.blocks_.push(block);
	};


	/**
	 * Get an array of rendering functions for trueBlocks or falseBlocks.
	 * 
	 * @return {!Array.<function(Object, boolean):string>} Array of rendering functions to call at
	 *		runtime.
	 * @private
	 */
	IteratorBlock.prototype.getSubRenderers_ = function(){

		var renderers = [];
		for (var i in this.blocks_){
			renderers.push(this.blocks_[i].getRenderer());
		};

		return renderers;
	};


	/**
	 * Get an array of the sources of rendering functions for the iterable blocks.
	 * 
	 * @return {!Array.<string>} Array of sources of rendering functions to call at runtime.
	 * @private
	 */
	IteratorBlock.prototype.getSubRendererSources_ = function(){

		var rendererSources = [];
		for (var i in this.blocks_){
			rendererSources.push(this.blocks_[i].getRendererSource());
		};

		return rendererSources;
	};




	/**
	 * A collection of methods for rendering compiled blocks once we have the data available to plug
	 * in, i.e. at "runtime". This is all that is needed by precompiled rendering functions.
	 */
	var Runtime = {

		/** 
		 * @param {Array.<function(Object, boolean=):string>} renderers
		 * @param {Object} data
		 * @param {boolean=} opt_ignoreUndefined
		 * @return {string}
		 */
		renderTemplate: function(renderers, data, opt_ignoreUndefined){

			var output = [];
			for (var i in renderers){
				output.push(renderers[i].call(null, data, opt_ignoreUndefined));
			};
			return output.join('');
		},


		/**
		 * @param {string} name
		 * @param {boolean} isRecursive
		 * @param {boolean} htmlEscape 
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderPlaceHolderBlock: function(name, isRecursive, htmlEscape, data, ignoreUndefined){

			var value = Runtime.getValue_(name, data);

			if (ignoreUndefined && value === undefined){
				
				// Leave the placeholder unchanged, i.e. reconstruct it.
				return htmlEscape ? '{{' + name + '}}' : '{{{' + name + '}}}';

			} else {

				if (value === undefined || value === null){
					return '';
				} else {
					var text = htmlEscape ? Runtime.htmlEscape_('' + value) : '' + value;
					if (isRecursive && text.indexOf('{{') !== -1) {
						// Need to compile text as a mini-template and render it.
						var render = DubStash.compile(text);
						text = render.call(null, data, ignoreUndefined);
					};
					return text;
				};
			};
		},


		/**
		 * @param {string} name
		 * @param {Array.<function(Object, boolean=):string>} trueRenderers
		 * @param {Array.<function(Object, boolean=):string>} falseRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderConditionBlock: function(name, trueRenderers, falseRenderers, data, ignoreUndefined){

			// Decide which set of renderers to use.
			var value = Runtime.getValue_(name, data);
			var renderers = value ? trueRenderers : falseRenderers;

			// Call the appropriate set of rendering functions in turn, and string the results 
			// together.
			var output = [];
			for (var i in renderers){
				output.push(renderers[i].call(null, data, ignoreUndefined));
			};

			return output.join('');
		},


		/**
		 * @param {string} name
		 * @param {Array.<function(Object, boolean=):string>} subRenderers
		 * @param {Object} data
		 * @param {boolean=} ignoreUndefined
		 * @return {string}
		 */
		renderIteratorBlock: function(name, subRenderers, data, ignoreUndefined){

			// Get the value, which should be an iterable collection.
			var collection = Runtime.getValue_(name, data);

			var output = [];

			// Iterate through the collection, writing out our sub-blocks for each item.
			if (collection){
				this.forEach_(collection, function(member){
					for (var i in subRenderers){
						output.push(subRenderers[i].call(null, member, ignoreUndefined));
					};
				});
			};

			return output.join('');
		},


		/**
		 * At runtime, return the value of a multi.level.property of an object.
		 *
		 * @param {string} name A property name to evaluate on obj. May contain dots.
		 * @param {Object} obj An object to use to evaluate the name.
		 * @return {*}
		 * @private
		 */
		getValue_: function(name, obj){

			// Take the first segment of a multi.segment.name and test obj with it.
			var i = name.indexOf('.');
			if (i > 0 && i < name.length - 1){
				var topName = name.slice(0, i);
				if (topName in obj){
					return Runtime.getValue_(name.slice(i + 1), obj[topName]);
				} else {
					return undefined;					
				};				
			} else {

				var value;
				if (typeof obj[name] === 'function'){
					// Call it.
					value = obj[name](); 
				} else {
					value = obj[name];	
				};

				// If the value is an empty array or an object with no values, return null. This
				// allows using {{if collection}} to test whether the collection has any values.
				// Unlike Python, in Javascript [] and {} are both truthy. In this case, the Python
				// behaviour is more desirable, as an empty collection is falsy.
				if (typeof value === 'object'){
					if (value instanceof Array){
						return value.length ? value : null;
					} else {
						for(var p in value){
							// There is at least one key: bail out now.
							return value;
						};
						// No keys.
						return null;
					};
				} else {
					
					return value;
				};
			};
		},


		/**
		 * Cycle through each member of a collection, calling the callback with each member.
		 *
		 * @param {Collection} collection An object that is supposed to be iterable.
		 * @param {function(*)} callback Called with each member as a parameter.
		 * @private
		 */
		forEach_: function(collection, callback){

			if (typeof collection.forEach === 'function'){
				// The collection already has this functionality, so use it.
				collection.forEach(callback);

			} else if (typeof collection.__iterator__ === 'function'){
				
				// It has a Javascript 1.7 style iterator function. We might not actually be on 1.7,
				// so we cannot just say 'for value in collection'. We'll use the iterator 
				// explicitly.
				var iterator = collection.__iterator__(false);
				var stopped = false;
				while (!stopped){
					try {
						var obj = iterator.next();
					} catch (ex){
						// Assume this is StopIterator. Since Node doesnt support this yet, it 
						// is difficult to write a script that would get us the global StopIterator
						// error to compare with.
						stopped = true;
					};
					if (!stopped){
						callback.call(this, obj);
					};
				};

			} else if (typeof collection === 'object'){
				// Either we're on a platform where Array does not yet have forEach, or this is
				// an object, so iterate through its values.
				for (var i in collection){
					callback.call(this, collection[i]);
				};
			} else {
				// It's probably not a collection. Just return itself as the first and only member.
				callback.call(this, collection);
			};
		},


		/**
		 * Make a string safe to be inserted where HTML expects regular text.
		 *
		 * @param {string} str
		 * @return {string}
		 * @private
		 */
		htmlEscape_: function(str) {

			return str.replace(Runtime.RE_AMP_, '&amp;')
					  .replace(Runtime.RE_LT_, '&lt;')
					  .replace(Runtime.RE_GT_, '&gt;')
					  .replace(Runtime.RE_QUOT_, '&quot;');
		},


		/**
		 * @type {RegExp}
		 * @private
		 */
		RE_LT_: /</g,


		/**
		 * @type {RegExp}
		 * @private
		 */
		RE_GT_: />/g,


		/**
		 * @type {RegExp}
		 * @private
		 */
		RE_AMP_: /&/g,


		/**
		 * @type {RegExp}
		 * @private
		 */
		RE_QUOT_: /\"/g
	};


	/**
	 * Define a console that can be used anywhere. Closure doesn't like console.log, but 
	 * window.console is OK. However, in Node, there is no 'window', but 'console' is a global.
	 */
	var Console = /** @suppress {checkVars} Ignore the unprefixed 'console'. */(function(){
		return this.console /* works in browsers, doesn't throw Node */ || console /* for Node*/; 
	})();


	// Make Runtime available externally under its proper name (Closure renames it internally)
	// Ditto for the methods that are called from precompiled code. @expose tags could have 
	// achieved this, but the compiled (not pre-compiled) functions would have been larger, as they
	// would not even be renamed internally.
	if (!DubStash['Runtime']){
		// We have been compiled by Closure - causing things to be renamed.
		DubStash['Runtime'] = Runtime;
		Runtime['renderTemplate'] = Runtime.renderTemplate;
		Runtime['renderPlaceHolderBlock'] = Runtime.renderPlaceHolderBlock;
		Runtime['renderConditionBlock'] = Runtime.renderConditionBlock;		
		Runtime['renderIteratorBlock'] = Runtime.renderIteratorBlock;
	};
	

	// Break out of this closure, and show Closure Compiler that this file has a side-effect. 
	// 'this' is the global object, i.e. 'window' in browsers.
	this['DubStash'] = DubStash;
	

	// Make available in Node. Encased in function to allow the @suppress tag to be honoured.
	/** @suppress {checkVars} */
	(function(){
		try{
			module['exports'] = DubStash;
		} catch (ex){};
	})();

})();