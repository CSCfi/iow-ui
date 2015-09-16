const name = 'iow.controllers';

const mod = angular.module(name, []);

mod.controller('groupController', require('./groupController'));
mod.controller('modelController', require('./modelController'));

module.exports = name;
