var compile = require('./compile');
var generateDocs = require('./generate-docs');


// If it compiles, generate the documentation.
compile().
    then(generateDocs).
    catch((err) => process.exit(1));
