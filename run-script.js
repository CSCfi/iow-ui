require('core-js');
require('css.escape');
const path = require('path');
const tsconfig = require('./tsconfig.json');

const config = {
  files: [],
  compilerOptions: Object.assign({}, tsconfig.compilerOptions, {
    typeRoots: [ 'node_modules/@types', 'types' ],
    types: [ 'node', 'webpack', 'karma', 'protractor' ]
  })
};

require('ts-node').register(config);

if (process.argv.length !== 3) {
  throw new Error('Must contain exactly one parameter');
} else {
  require(path.join(__dirname, 'scripts', process.argv[2]));
}
