const name = 'iow.components.common';
const mod = angular.module(name, []);
module.exports = name;

mod.directive('windowHeight', require('./windowHeight'));
mod.directive('iowTypeahead', require('./typeahead'));
mod.directive('float', require('./float'));
mod.directive('modalTemplate', require('./modalTemplate'));
mod.directive('accordionChevron', require('./accordionChevron'));
mod.factory('confirmationModal', require('./confirmationModal'));

mod.filter('translateValue', (languageService) => {
  'ngInject';
  return (input) => input ? languageService.translate(input) : '';
});

mod.filter('translateLabel', (translateValueFilter) => {
  'ngInject';
  return input => input ? translateValueFilter(input.label) : '';
});

mod.filter('orderByLabel', (translateLabelFilter, orderByFilter) => {
  'ngInject';
  return array => {
    return orderByFilter(array, translateLabelFilter);
  };
});

mod.filter('urlencode', function urlencode() {
  return input => {
    return window.encodeURIComponent(input);
  };
});
