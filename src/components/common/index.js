const name = 'iow.components.common';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('windowHeight', require('./windowHeight'));
mod.directive('iowTypeahead', require('./typeahead'));
mod.directive('float', require('./float'));
