const name = 'iow.components';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));
mod.directive('modelView', require('./modelView'));
mod.directive('classView', require('./classView'));
mod.directive('attributeView', require('./attributeView'));
mod.directive('associationView', require('./associationView'));
mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.directive('predicateView', require('./predicateView'));
mod.directive('propertyView', require('./propertyView'));
mod.directive('formInput', require('./formInput'));
mod.directive('formId', require('./formId'));
mod.directive('formSelect', require('./formSelect'));
mod.directive('formTextArea', require('./formTextArea'));
mod.directive('editableForm', require('./editableForm'));
mod.directive('editableFormButtons', require('./editableFormButtons'));
mod.directive('login', require('./login'));
mod.directive('referencesView', require('./referencesView'));
mod.directive('requiresView', require('./requiresView'));
mod.directive('showSubmitError', require('./showSubmitError'));

mod.controller('groupController', require('./groupController'));
mod.controller('modelController', require('./modelController'));

mod.factory('editInProgressModal', require('./editInProgressModalFactory'));
mod.factory('searchPredicateModal', require('./searchPredicateModalFactory'));
mod.factory('searchClassModal', require('./searchClassModalFactory'));

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
