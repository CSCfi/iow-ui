const name = 'iow.components.modal';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('modalTemplate', require('./modalTemplateDirective'));
mod.factory('confirmationModal', require('./confirmationModalFactory'));
