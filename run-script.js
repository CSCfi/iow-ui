require('core-js');
require('css.escape');
const path = require('path');
const tsconfig = require('./tsconfig.json');

tsconfig.compilerOptions.types = [ 'node', 'webpack', 'karma', 'protractor' ];
tsconfig.files = [];

require('ts-node').register(tsconfig);

if (process.argv.length !== 3) {
  throw new Error('Must contain exactly one parameter');
} else {
  require(path.join(__dirname, 'scripts', process.argv[2]));
}
