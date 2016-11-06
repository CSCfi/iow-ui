const path = require('path');
const tsconfig = require('./tsconfig.json');

require('ts-node').register(
  Object.assign(tsconfig, {
    compilerOptions: {
      module: 'commonjs',
      types: [
        'node',
        'webpack',
        'karma',
        'protractor'
      ]
    },
    files: []
  })
);

if (process.argv.length !== 3) {
  throw new Error('Must contain exactly one parameter');
} else {
  require(path.join(__dirname, 'scripts', process.argv[2]));
}
