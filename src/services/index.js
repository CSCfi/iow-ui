const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('classService', require('./classService'));
mod.factory('conceptService', require('./conceptService'));
mod.factory('entities', require('./entities'));
mod.factory('groupService', require('./groupService'));
mod.factory('languageService', require('./languageService'));
mod.factory('locationService', require('./locationService'));
mod.factory('modelCache', require('./modelCache'));
mod.factory('modelService', require('./modelService'));
mod.factory('predicateService', require('./predicateService'));
mod.factory('searchService', require('./searchService'));
mod.factory('userService', require('./userService'));

module.exports = name;
