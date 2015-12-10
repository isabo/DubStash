var compiler = require('closure-compiler');

// Read the version from the NPM package file.
var version = require('../package.json').version;

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


/**
 * Return a promise that settles when the compilation has finished.
 *
 * @return {!Promise<null,!Error>}
 */
var compile = module.exports = function() {
    return new Promise(function(resolve, reject) {
        compiler.compile(undefined, options, function(err, stdout, stderr) {
            console.log('Google Closure Compiler:');
            console.log(stderr);
            !err ? resolve() : reject(err);
        });
    });
};


// Execute immediately if this module was invoked directly.
if (!module.parent) {
    compile().
        catch(function(err) {
            console.error(err);
            process.exit(1);
        });
}
