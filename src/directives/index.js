const _ = require('lodash');

const name = 'iow.directives';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));
mod.directive('classView', require('./classView'));
mod.directive('attributeView', require('./attributeView'));
mod.directive('associationView', require('./associationView'));
mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.directive('predicateView', require('./predicateView'));
mod.directive('propertyView', require('./propertyView'));
mod.directive('searchForm', require('./searchForm'));
mod.directive('formInput', require('./formInput'));
mod.directive('editableForm', require('./editableForm'));

mod.filter('urlencode', function urlencode() {
  return input => {
    return window.encodeURIComponent(input);
  };
});

mod.filter('curie', () => uri =>
  _.last(uri.split(":"))
);

module.exports = name;
