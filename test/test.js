var test = require('tape');
var DubStash = require('../distributable/dubstash.min');


/**
 * Utility function that generates the source code of a precompiled template, then parses it into a
 * Javascript function object.
 *
 * @param {Object} t The test instance.
 * @param {string} tpl The template that we're testing.
 * @return {Function}
 */
function getPrecompiledRenderer(t, tpl) {

    var rendererSource = DubStash.precompile(tpl);
    t.equal(typeof rendererSource, 'string',
        'Template precompiles to a string, hopefully of source code');
    t.ok(rendererSource.indexOf('function(') === 0,'Looks like a function definition');

    // Parse the function into a local variable.
    // The raw definition needs to be bracketed for this.
    var renderFn = eval('(' + rendererSource + ')');
    t.ok(typeof renderFn === 'function', 'Parsed as a function');

    return renderFn;
}


/**
 * Utility function that generates regular and precompiled rendering functions, applies the data and
 * compares the output.
 *
 * @param {Object} t The test instance.
 * @param {string} tpl The template that we're testing.
 * @param {*} expected The value we expect the output to be.
 * @param {string} comment The comment to write to the test results.
 */
function test_render(t, tpl, data, expected, comment) {

    var render = DubStash.compile(tpl);
    var output = render(data);
    t.equal(output, expected, comment);

    render = getPrecompiledRenderer(t, tpl);
    output = render(data);
    t.equal(output, expected, comment);
}


/**
 * Test the trivial case in which a placeholder should be replaced by an object property value.
 */
test('Simple placeholder', function(t) {

    var tpl = '{{result}}';
    var data = {
        result: 'Result'
    };

    test_render(t, tpl, data, data.result, 'Placeholder is substituted with a value');
    t.end();
});


/**
 * Verify that an undefined placeholder is replaced with an empty string.
 */
test('Undefined placeholder', function(t) {

    var tpl = 'a{{xyz}}a';
    var data = {};

    test_render(t, tpl, data, 'aa', 'Undefined placeholder is substituted with an empty string');
    t.end();
});


/**
 * Verify that <>&" are escaped when in double stashes, and not escaped when in triple stashes.
 */
test('Handling of unsafe values', function(t) {

    var tpl = '{{result}}';
    var data = {
        result: '"x > y & z < a"'
    };

    test_render(t, tpl, data, '&quot;x &gt; y &amp; z &lt; a&quot;',
        'Unsafe values are escaped when enclosed in double stash');
    test_render(t, '{' + tpl + '}', data, data.result,
        'Unsafe values are not escaped when enclosed in triple stash');
    t.end();
});


/**
 * Verify that deep values can be extracted.
 */
test('Multi.level.placeholder', function(t) {

    var tpl = '{{multi.level.result}}';
    var data = {
        multi: {
            level: {
                result: 'Result'
            }
        }
    };

    test_render(t, tpl, data, data.multi.level.result, 'Deep property values are extracted');
    t.end();
});


/**
 * Verify that recursive placeholders work, through multiple levels.
 */
test('Recursive placeholders', function(t) {

    var tpl = '{{result /r}}{{result}}';
    var data = {
        result: '{{result2 /r}}',
        result2: '{{result3}}',
        result3: 'Result'
    };

    test_render(t, tpl, data, data.result3 + data.result,
        'Placeholders are evaluated recursively through multiple levels, and only when specified');
    t.end();
});


/**
 * Verify conditional templates.
 */
test('Conditions - boolean, truthy and falsy', function(t) {

    var data = {
        t: true,
        ty1: 1,
        tyA: 'a',
        tyArr: ['a'],
        tyObj: {x: 3},
        f: false,
        fy1: 0,
        fyA: '',
        fyArr: [],
        fyObj: {},
        result: 'Result'
    };

    test_render(t, '{{if t}}{{result}}{{end if}}', data, data.result, 'Processes true condition');
    test_render(t, '{{if t}}{{result}}{{else}}Oops{{end if}}', data, data.result,
        'Ignores else when condition is true');
    test_render(t, '{{if ty1}}{{result}}{{end if}}', data, data.result,
        'Processes numeric truthy condition');
    test_render(t, '{{if tyA}}{{result}}{{end if}}', data, data.result,
        'Processes text truthy condition');
    test_render(t, '{{if tyArr}}{{result}}{{end if}}', data, data.result,
        'Array with elements is truthy');
    test_render(t, '{{if tyObj}}{{result}}{{end if}}', data, data.result,
        'Object with properties is truthy');

    test_render(t, '{{if f}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Processes false condition');
    test_render(t, '{{if fy1}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Processes numeric falsy condition');
    test_render(t, '{{if fyA}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Processes text falsy condition');
    test_render(t, '{{if fyArr}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Empty array is falsy');
    test_render(t, '{{if fyObj}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Object with no properties is falsy');

    t.end();
});


test('Recursive conditions', function(t) {

    var data = {
        truthy: '{{result}}',
        falsy: '{{noSuchProperty}}',
        result: 'Result'
    };

    test_render(t, '{{if truthy /r}}{{truthy /r}}{{end if}}', data, data.result,
        'Evaluates truthy condition after recursing');
    test_render(t, '{{if falsy /r}}Oops{{else}}{{result}}{{end if}}', data, data.result,
        'Evaluates falsy condition after recursing');

    t.end();
});


/**
 * Verify iteration of arrays, objects and objects with a .forEach method.
 */
test('Iteration - arrays and objects', function(t) {

    // Class with a .forEach method should be iterable.
    var Iterable = function(){
        this.items_ = [
            {char: 'O'},
            {char: 'K'}
        ];
    };
    Iterable.prototype.forEach = function(callback){

        for (var i in this.items_){
            callback(this.items_[i]);
        };
    };

    var data = {
        array: [
            {char: 'O'},
            {char: 'K'}
        ],
        emptyArray: [],
        object: {
            'a': {char: 'O'},
            'b': {char: 'K'}
        },
        emptyObject: {},
        iterable: new Iterable(),
        result: 'OK'
    };

    test_render(t, '{{foreach array}}{{char}}{{end foreach}}', data, data.result,
        'Iterates array items');
    test_render(t, '{{foreach emptyArray}}{{char}}{{end foreach}}', data, '',
        'Empty array results in empty string');
    test_render(t, '{{foreach object}}{{char}}{{end foreach}}', data, data.result,
        'Iterates object property values');
    test_render(t, '{{foreach emptyObject}}{{char}}{{end foreach}}', data, '',
        'Iterates object property values');
    test_render(t, '{{foreach iterable}}{{char}}{{end foreach}}', data, data.result,
        'Iterates iterable object');
    t.end();
});


/**
 * Verify that property paths are relative, i.e. that we can 'climb' to parent contexts.
 */
test('Object hierarchy climbing', function(t) {

    var data = {
        items: [
            {name: 'O'}
        ],
        result: 'OK',
        x: {
            result: 'K'
        },
        recursiveItems: [
            {name: '{{../../result}}'}
        ]
    };

    test_render(t, '{{foreach items}}{{../../result}}{{end foreach}}', data, data.result,
        'Climbs out of ../property');
    test_render(t, '{{foreach items}}{{name}}{{../../x.result}}{{end foreach}}', data, data.result,
        'Climbs and dives ../object.property');
    test_render(t, '{{foreach recursiveItems}}{{name /r}}{{end foreach}}', data, data.result,
        'Climbs out of recursive template inside iteration');

    t.end();
});


/**
 * Verify that global templates work.
 */
test('Global template', function(t) {

    DubStash.registerGlobalTemplate('ageInWords', '{{age}} years old');

    var data = {
        name: 'John Smith',
        age: 35
    };

    test_render(t, '{{name}}, {{ageInWords /r}}', data, data.name + ', ' + data.age + ' years old',
        'Evaluates global template');
    t.end();
});


/**
 * Verify that global data can be used in a regular template.
 */
test('Global data', function(t) {

    DubStash.registerGlobalData('PRODUCT_NAME', 'DubStash');

    test_render(t, '{{PRODUCT_NAME}}', {}, 'DubStash', 'Uses global data');
    t.end();
});

// test error generation where appropriate
