var compile = require('./compile');
var generateDocs = require('./generate-docs');


// If it compiles, generate the documentation.
compile().
    then(generateDocs).
    catch(function(err) {
        process.exit(1)
    });
