const name = 'iow.controllers';

const mod = angular.module(name, []);

mod.controller('groupController', require('./GroupController'));

module.exports = name;
