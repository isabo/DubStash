DubStash
========

DubStash is a template engine for minimum-logic HTML templates. It is faster and leaner than 
Handlebars, but doesn't try to do as much.

* Works in browsers or on a back-end Node server.
* Compile templates at runtime; use repeatedly.
* Precompile templates to Javascript at build time for even faster loading.

## tl;dr

* `<script src="dubstep.min.js"></script>` [Details...](#deploying)
* {{placeholder}}, {{{don't-escape-this-value}}} [Details...](#basic-usage)
* {{<strong>if</strong> something}} ... {{else}} ... {{end if}} [Details...](#conditons)
* {{<strong>foreach</strong> things}} ... {{end foreach}} [Details...](#iterations)
* [Recursive evaluation](#recursion): {{placeholder **/r**}}
* [Precompilation of templates to Javascript](#precompilation)

## Usage

### Basic Usage

* Define a template that contains `{{placeholders}}` for text that will be substituted at runtime. 
* Generate a rendering function by compiling the template.
* Call the rendering function with an object that contains the data to subsitute for the 
  `{{placeholders}}`. 
* The text that replaces `{{placeholders}}` is escaped for safe use in HTML, unless you use a 
  `{{{triple stash}}}` (not shown).

```js
// Define the template. 
// (By the way, the HTML5 <template> tag is a useful place to stick your templates.)
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

### Recursion

Placeholders will be evaluated recursively when the `/r` flag is used:

```js
var messages = {
	appName: 'HelloWorld',
	welcome: 'Thank you for installing "{{appName}}"'
};

var render = DubStash.compile('<p>{{welcome /r}}</p>');
var output = render(messages);
```

The value of `output` is:
```html
<p>Thank you for installing "HelloWorld"</p>
```

### Iterations

* You can loop over values that are collections of objects, repeating a snippet of template for each
  one.
* Inside the loop, the data object is the current member of the collection being iterated. In the 
  example below `{{name}}` is used twice, but the second instance refers to a different person.
* Not only arrays can be iterated. Objects can be iterated, as well as anything that has a `forEach` 
  method. 

```js
var template = '<p>These are the people that {{name}} invited:</p>' +
			   '<ul>{{foreach invitees}}<li>{{name}}</li>{{end foreach}}</ul>';
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
	<li>Fred Bloggs</li>
	<li>Jack Jackson</li>
	<li>Mary Black</li>
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

## Precompilation

* You can precompile templates into Javascript that can be inserted into your source files. 
* Runtime startup will be faster because there will be no need for a `DubStep.compile()` step.
* You still need to include a link to the DubStep script in your HTML, because precompiled functions
  still depend on it.

```js
// Typically you would do this in Node, where you can save the precompiled functions without having
// to manually copy/paste them into a .js source file.
var DubStep = require('./dubstep.js');

var template = 'My name is {{name}}.';
var source = DubStep.precompile(template);

// Write source into a Javascript file.
...
```

## Deploying

Your HTML file needs to use the DubStep script. Use the distributable version 
[dubstep.min.js](http://).

```html
<html>
	<head>
		...
		<script src="dubstep.min.js"></script>
		...
	</head>
	<body>
		...
	</body>
</html>
```

## Building

DubStep is compiled and minified using Google Closure Compiler. The following command line does it:

```
java -jar /path/to/compiler.jar --js dubstep.js --compilation_level=ADVANCED_OPTIMIZATIONS  --warning_level=VERBOSE 
	--jscomp_warning=checkTypes --output_wrapper="(function() {%output%})();" --js_output_file=dubstep.min.js
```