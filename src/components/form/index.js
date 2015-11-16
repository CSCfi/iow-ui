const name = 'iow.components.form';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('idInput', require('./idInput'));
mod.directive('localizedInput', require('./localizedInput'));
mod.directive('editable', require('./editable'));
mod.directive('editableButtons', require('./editableButtons'));
mod.directive('valueSelect', require('./valueSelect'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.factory('editableController', require('./editableController'));
