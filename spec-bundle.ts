/// <reference path="./node_modules/awesome-typescript-loader/lib/runtime.d.ts" />
/// <reference path="./typings/globals/jasmine/index.d.ts" />

import 'core-js';

const testContext = require.context('./src', true, /\.spec\.ts/);

/*
 * get all the files, for each file, call the context function
 * that will require the file and load it up here. Context will
 * loop and require those spec files here
 */
function requireAll(requireContext: WebpackContext) {
  return requireContext.keys().map(requireContext);
}
// requires and returns all modules that match
const modules = requireAll(testContext);

