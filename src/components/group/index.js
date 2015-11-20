const name = 'iow.components.group';
const mod = angular.module(name, []);
module.exports = name;

mod.controller('groupController', require('./groupController'));
mod.factory('addModelModal', require('./addModelModal'));
