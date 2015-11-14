const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('groupService', require('./groupService'));
mod.factory('modelService', require('./modelService'));
mod.factory('languageService', require('./languageService'));
mod.factory('predicateService', require('./predicateService'));
mod.factory('searchService', require('./searchService'));
mod.factory('classService', require('./classService'));
mod.factory('userService', require('./userService'));
mod.factory('conceptService', require('./conceptService'));
mod.factory('locationService', require('./locationService'));
mod.factory('entities', require('./entities'));

module.exports = name;
