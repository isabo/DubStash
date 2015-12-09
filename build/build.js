// Read the version from the NPM package file.
var version = require('../package.json').version;


var compiler = require('closure-compiler');

var options = {
        js: ['src/**.js', '!src/externs/**', 'node_modules/google-closure-library/closure/goog/base.js'],
        externs: 'src/externs/externs.js',
        output_wrapper_file: 'build/wrapper.js',
        js_output_file: 'distributable/dubstash.min.js',
        compilation_level: 'ADVANCED',
        warning_level: 'VERBOSE',
        summary_detail_level: '3',
        generate_exports: true,
        define: "DubStash.VERSION='" + version + "'"
    };

compiler.compile(undefined, options, function(err, stdout, stderr) {

    console.log(stderr);
});
