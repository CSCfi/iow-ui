const name = 'iow.components';

const mod = angular.module(name, []);

mod.directive('groupList', require('./groupList'));
mod.directive('modelView', require('./modelView'));
mod.directive('classView', require('./classView'));
mod.directive('classForm', require('./classForm'));
mod.directive('predicateView', require('./predicateView'));
mod.directive('predicateForm', require('./predicateForm'));
mod.directive('globalLanguageChooser', require('./globalLanguageChooser'));
mod.directive('modelLanguageChooser', require('./modelLanguageChooser'));
mod.directive('propertyPredicateView', require('./propertyPredicateView'));
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
mod.directive('windowHeight', require('./windowHeight'));
mod.directive('rangeSelect', require('./rangeSelect'));
mod.directive('iowTypeahead', require('./typeahead'));
mod.directive('float', require('./float'));

mod.controller('groupController', require('./groupController'));
mod.controller('modelController', require('./modelController'));

mod.factory('editInProgressModal', require('./editInProgressModalFactory'));
mod.factory('searchPredicateModal', require('./searchPredicateModalFactory'));
mod.factory('searchClassModal', require('./searchClassModalFactory'));
mod.factory('searchConceptModal', require('./searchConceptModalFactory'));
mod.factory('deleteConfirmModal', require('./deleteConfirmModalFactory'));

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
