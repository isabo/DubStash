var compile = require('./compile');
var generateDocs = require('./generate-docs');


// If it compiles, generate the documentation.
compile().
    then(generateDocs).
    then(function() {
        process.exit(0);
    }, function(err) {
        process.exit(1);
    });
