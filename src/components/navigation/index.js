const name = 'iow.components.navigation';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('login', require('./login'));
mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));
mod.directive('breadcrumb', require('./breadcrumb'));
