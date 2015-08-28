const name = 'iow.restapi';

const mod = angular.module(name, []);
mod.factory('RestAPI', require('./restapi-factory'));

module.exports = name;
