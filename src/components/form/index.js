const name = 'iow.components.form';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('idInput', require('./idInput'));
mod.directive('localizedInput', require('./localizedInput'));
mod.directive('editable', require('./editable'));
mod.directive('valueSelect', require('./valueSelect'));
