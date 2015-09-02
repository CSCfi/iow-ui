const name = 'iow.controllers';

const mod = angular.module(name, []);

mod.controller('GroupController', require('./GroupController'));

module.exports = name;
