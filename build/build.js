var compiler = require('closure-compiler');
// var fs = require('fs');

var options = {
        js: 'src/dubstash.js',
        externs: 'src/externs.js',
        // output_wrapper: '(function(){%output%})();',
        js_output_file: 'distributable/dubstash.min.js',
        compilation_level: 'ADVANCED',
        warning_level: 'VERBOSE',
        summary_detail_level: '3',
        generate_exports: true
    };

compiler.compile(undefined, options, function(err, stdout, stderr) {

    console.log(stderr);
});
