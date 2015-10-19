const name = 'iow.components';

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
mod.directive('formId', require('./formId'));
mod.directive('formSelect', require('./formSelect'));
mod.directive('editableForm', require('./editableForm'));
mod.directive('login', require('./login'));
mod.directive('addProperty', require('./addProperty'));

mod.controller('groupController', require('./groupController'));
mod.controller('modelController', require('./modelController'));

mod.filter('translateValue', (modelLanguage) => {
  return (input) => input ? modelLanguage.translate(input) : '';
});

mod.filter('translateLabel', (translateValueFilter) => {
  return input => input ? translateValueFilter(input.label) : '';
});

mod.filter('orderByLabel', (translateLabelFilter, orderByFilter) => {
  return array => {
    return orderByFilter(array, translateLabelFilter);
  };
});

mod.filter('urlencode', function urlencode() {
  return input => {
    return window.encodeURIComponent(input);
  };
});

module.exports = name;
