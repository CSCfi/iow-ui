const name = 'iow.directives';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));

module.exports = name;
