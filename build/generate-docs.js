var exec = require('child_process').exec;

// Where is Dossier?
var JAR_PATH = require.resolve('js-dossier/dossier.jar');

// Build the command.
var COMMAND = 'java -jar ' + JAR_PATH + ' -c ./build/dossier-config.json';


/**
 * Return a promise that settles when the process has finished.
 *
 * @return {!Promise<null,!Error>}
 */
var generateDocs = module.exports = function() {
    return new Promise(function(resolve, reject) {
        exec(COMMAND, {maxBuffer: 400 * 1024}, function(err, stdout, stderr) {
            console.log(stdout);
            if (err) {
                console.log(stderr);
            }
            !err ? resolve() : reject(err);
        });
    });
};


// Execute immediately if this module was invoked directly.
if (!module.parent) {
    generateDocs().
        catch(function(err) {
            console.error(err);
            process.exit(1);
        });
}
