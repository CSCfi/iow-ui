const name = 'iow.services';

const mod = angular.module(name, []);

mod.factory('groupService', require('./groupService'));
mod.factory('modelService', require('./modelService'));
mod.factory('languageService', require('./languageService'));
mod.factory('modelLanguage', require('./modelLanguage'));
mod.factory('propertyService', require('./propertyService'));
mod.factory('searchService', require('./searchService'));

module.exports = name;
