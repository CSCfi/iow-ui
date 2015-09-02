const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('GroupService', require('./GroupService'));

module.exports = name;
