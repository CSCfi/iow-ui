const name = 'iow.components.form';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('formInput', require('./formInput'));
mod.directive('formId', require('./formId'));
mod.directive('formSelect', require('./formSelect'));
mod.directive('formTextArea', require('./formTextArea'));
mod.directive('editableForm', require('./editableForm'));
mod.directive('editableFormButtons', require('./editableFormButtons'));
mod.directive('showSubmitError', require('./showSubmitError'));
mod.directive('rangeSelect', require('./rangeSelect'));
