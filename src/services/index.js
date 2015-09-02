const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('groupService', require('./groupService'));

module.exports = name;
