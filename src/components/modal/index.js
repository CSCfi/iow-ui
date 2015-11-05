const name = 'iow.components.modal';
const mod = angular.module(name, []);
module.exports = name;

mod.factory('editInProgressModal', require('./editInProgressModalFactory'));
mod.factory('deleteConfirmModal', require('./deleteConfirmModalFactory'));
