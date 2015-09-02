const name = 'iow.groups';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));
mod.factory('GroupService', require('./GroupService'));

module.exports = name;
