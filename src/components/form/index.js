const name = 'iow.components.form';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('editable', require('./editable'));
mod.directive('editableButtons', require('./editableButtons'));
mod.factory('editableController', require('./editableController'));
mod.directive('idInput', require('./idInput'));
mod.directive('localizedInput', require('./localizedInput'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.directive('nonEditable', require('./nonEditable'));
mod.directive('stateSelect', require('./stateSelect'));
mod.directive('valueSelect', require('./valueSelect'));
