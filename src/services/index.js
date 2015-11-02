const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('groupService', require('./groupService'));
mod.factory('modelService', require('./modelService'));
mod.factory('languageService', require('./languageService'));
mod.factory('modelLanguage', require('./modelLanguage'));
mod.factory('predicateService', require('./predicateService'));
mod.factory('predicateCreatorService', require('./predicateCreatorService'));
mod.factory('searchService', require('./searchService'));
mod.factory('classService', require('./classService'));
mod.factory('classCreatorService', require('./classCreatorService'));
mod.factory('classPropertyService', require('./classPropertyService'));
mod.factory('userService', require('./userService'));

module.exports = name;
