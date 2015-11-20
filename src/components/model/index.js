const name = 'iow.components.model';
const mod = angular.module(name, []);
module.exports = name;

mod.controller('modelController', require('./modelController'));

mod.factory('addRequireModal', require('./addRequireModal'));
mod.directive('modelView', require('./modelView'));
mod.directive('referencesView', require('./referencesView'));
mod.directive('requiresView', require('./requiresView'));
mod.factory('searchRequireModal', require('./searchRequireModal'));
mod.factory('searchSchemeModal', require('./searchSchemeModal'));

