const name = 'iow.groups';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));

module.exports = name;
