DubStash
========

DubStash is a fast semantic template engine for HTML. 

* Use it in a client-side browser or on a back-end Node.js server.
* Compile a template at runtime, then use it repeatedly with different data.
* Optionally, precompile templates to Javascript at build time for even faster loading.

## tl;dr

* `<script src="dubstash.min.js"></script>` [Details...](#deploying)
* {{[placeholder](#basic-usage)}}, {{{don't-escape-this-triple-stashed-value}}}
* {{<strong>[if](#conditions)</strong> something}} ... {{else}} ... {{end if}}
* {{<strong>[foreach](#iterations)</strong> things}} ... {{end foreach}}
* Different templates can make use of common building blocks known as [global templates](#global-templates).
* [Recursive evaluation](#recursion): {{placeholder **/r**}} or even {{if something **/r**}}
* [Precompilation of templates to Javascript](#precompilation)

## Usage

### Basic Usage

* Define a template that contains `{{placeholders}}` for values that will be substituted at runtime. 
* Generate a rendering function by compiling the template.
* Call the rendering function with an object that contains the data to subsitute for the 
  `{{placeholders}}`. 
* The text that replaces `{{placeholders}}` is escaped for safe use in HTML, unless you use a 
  `{{{triple-stash}}}` (not shown).

```js
// Define the template. You normally won't do this using Javascript. Instead you can use the new
// HTML5 <template> tag, or put your templates inside <script type="text/dubstash">...</script>,
// and assign the contents to a Javascript variable using the script tag's innerHTML property. 
var template = '<ul><li>My name is {{name}}.</li>' +
			   '<li>I live in {{address.city}}.</li>' +
			   '<li>My favourite cartoon is {{cartoon}}.</li></ul>';	

// Generate a rendering function that can be used multiple times with different data.
var render = DubStash.compile(template);

// Define some example data objects.
var person1 = {
	name: 'John Smith',
	address: {
		city: 'Cardiff'
	},
	cartoon: 'Calvin & Hobbes'
};

var person2 = {
	name: 'Fred Bloggs',
	address: {
		city: 'Swansea'
	},
	cartoon: 'Tom & Jerry'
};

// Render the template with different data.
var output1 = render(person1);
var output2 = render(person2);
```

The value of `output1` is:
```html
<ul>
	<li>My name is John Smith.</li>
	<li>I live in Cardiff.</li>
	<li>My favourite cartoon is Calvin &amp; Hobbes.</li>
</ul>

<!-- Linebreaks and indents added for clarity -->
```

The value of `output2` is:
```html
<ul>
	<li>My name is Fred Bloggs.</li>
	<li>I live in Swansea.</li>
	<li>My favourite cartoon is Tom &amp; Jerry.</li>
</ul>

<!-- Linebreaks and indents added for clarity -->
```

### Iterations

* You can loop over values that are collections of objects, repeating a snippet of template for each
  one.
* Inside the loop, the data object is the current member of the collection being iterated. In the 
  example below `{{name}}` is used twice, but the second instance refers to a different person.
  * Inside a loop, you can still access the parent object by prefixing the property name with `../`
    or `../../` etc. 
* Not only arrays can be iterated. Objects can be iterated, as well as anything that has a `forEach` 
  method. 

```js
var template = '<p>These are the people that {{name}} invited:</p>' +
			   '<ul>{{foreach invitees}}<li>{{name}} (invited by {{../../name}})</li>{{end foreach}}</ul>';
var render = DubStash.compile(template);

var person = {
	name: 'John Smith',
	invitees: [
		{name: 'Fred Bloggs'},
		{name: 'Jack Jackson'},
		{name: 'Mary Black'}
	]
};

var output = render(person);
```

The value of `output` is:
```html
<p>These are the people that John Smith invited:</p>
<ul>
	<li>Fred Bloggs (invited by John Smith)</li>
	<li>Jack Jackson (invited by John Smith)</li>
	<li>Mary Black (invited by John Smith)</li>
</ul>

<!-- Linebreaks and indents added for clarity -->
```

### Conditions

* Use `{{if propertyName}} ... {{else}} ... {{endif}}` for including text conditionally.
* An empty array or object will evaluate to `false`, so you can easily test whether a collection has
  items in it.

```js
var template = '<p>Dear {{if isMale}}Sir{{else}}Madam{{endif}},</p>' +
			   '{{if itemsOrdered}}'
			   '<p>These are the items you ordered:</p>' +
			   '<ul>' +
					'{{foreach itemsOrdered}}<li>{{name}}</li>{{end foreach}}' +
			   '</ul>' +
			   '{{else}}' +
			   '<p>You have not ordered anything recently.</p>' +
			   '{{end if}}';
var render = DubStash.compile(template);

var recipient = {
	gender: 'f',
	isMale: function(){
		return recipient.gender === 'm';
	},
	itemsOrdered: [
		{name: 'Grand Piano'},
		{name: 'Violin'},
		{name: 'Flute'}
	]
};

var output = render(recipient);
```

The value of `output` is:
```html
<p>Dear Madam,</p>
<p>These are the items you ordered:</p>
<ul>
	<li>Grand Piano</li>
	<li>Violin</li>
	<li>Flute</li>
</ul>

<!-- Linebreaks and indents added for clarity -->
```

### Global Templates

* Different templates can make use of common building blocks known as global templates. This 
  provides similar functionality to 'partials' and 'helpers' used in other templating engines.
* Using a global template will not double-escape your HTML.

```js
// 'bestName' is a template that writes out the best name to use for greeting a person:
DubStash.registerGlobalTemplate('bestName', 
	'{{if nickName}}{{nickName}}{{else}}{{firstName}}{{end if}}');

// Define the text of a generic letter.
var renderLetter = DubStash.compile('<p>Dear {{bestName /r}},</p>');

var person1 = {
	firstName: 'William',
	lastName: 'Smith',
	nickName: 'Bill'
};

var person2 = {
	firstName: 'Frederick',
	lastName: 'Bloggs'	
};

var output1 = renderLetter(person1);
var output2 = renderLetter(person2);
```

The value of `output1` is:
```html
<p>Dear Bill,</p>
```

The value of `output2` is:
```html
<p>Dear Frederick,</p>
```

### Recursion

* If the result of an expression may itself be a template that should be evaluated, use the `/r` flag.
* Recursive evaluation will not double-escape the HTML.

In the [global templates](#global-templates) example, the greeting template does not handle a case 
where we don't know a person's first name or nickname. Let's improve it to handle such a case.

```js
// 'bestName' is a template that writes out the best name to use for greeting a person:
DubStash.registerGlobalTemplate('bestName', 
	'{{if nickName}}{{nickName}}{{else}}{{firstName}}{{end if}}');

// Define the text of a generic letter. If we don't know a person's name, say 'Sir'.
var renderLetter = DubStash.compile(
	'<p>Dear {{if bestName /r}}{{bestName /r}}{{else}}Sir{{end if}},</p>');

var person3 = {
	lastName: 'Heisenberg'
};

var output3 = renderLetter(person3);
```

The value of `output3` is:
```html
<p>Dear Sir,</p>
```

## Precompilation

* You can precompile templates into Javascript functions that can be inserted into your source files. 
* Runtime startup will be faster because there will be no need for a `DubStash.compile()` step.
* You still need to include a link to the DubStash script in your HTML, because precompiled 
  functions still depend on it.
* Global templates that have already been registered are all compiled together as a single block.

```js
// Typically you would do this in Node, where you can save the precompiled functions without having
// to manually copy/paste them into a .js source file.
var DubStash = require('./dubstash.js');

// 'bestName' is a template that writes out the best name to use for greeting a person:
DubStash.registerGlobalTemplate('bestName', 
	'{{if nickName}}{{nickName}}{{else}}{{firstName}}{{end if}}');
var globalsSource = DubStash.precompileGlobalTemplates();

var template = 'My name is {{bestName}}.';
var rendererSource = DubStash.precompile(template);

// Build the output which should be saved as a JS file.
var output = globalsSource + '\n';
output += 'var render = ' + rendererSource;
...
```

## Deploying

Your HTML file needs to use the DubStash script. Use the distributable version 
[dubstash.min.js](https://raw.github.com/isabo/DubStash/1.0.0.rc5/distributable/dubstash.min.js).

```html
<html>
	<head>
		...
		<script src="dubstash.min.js"></script>
		...
	</head>
	<body>
		...
	</body>
</html>
```

## Building

DubStash is compiled and minified using Google Closure Compiler. The following command line does it:

```
java -jar /path/to/compiler.jar --js src/dubstash.js --externs src/externs.js 
	--output_wrapper="(function(){%output%})();" --js_output_file=distributable/dubstash.min.js 
	--compilation_level=ADVANCED_OPTIMIZATIONS --warning_level=VERBOSE --jscomp_warning=checkTypes 
	
```