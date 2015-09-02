const name = 'iow.controllers';

const mod = angular.module(name, []);

mod.controller('groupController', require('./groupController'));

module.exports = name;
