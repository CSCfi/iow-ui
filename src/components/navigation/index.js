const name = 'iow.components.navigation';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.directive('login', require('./login'));
