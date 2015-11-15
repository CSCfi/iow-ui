const name = 'iow.components.group';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('groupList', require('./groupList'));
mod.controller('groupController', require('./groupController'));
mod.factory('addModelModal', require('./addModelModal'));
