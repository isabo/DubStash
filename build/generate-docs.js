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
        exec(COMMAND, function(err, stdout, stderr) {
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
        catch(() => process.exit(1));
}