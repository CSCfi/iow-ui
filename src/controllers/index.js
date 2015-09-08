const name = 'iow.controllers';

const mod = angular.module(name, []);

mod.controller('groupController', require('./GroupController'));
mod.controller('modelController', require('./modelController'));

module.exports = name;
