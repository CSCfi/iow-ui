
export const mod = angular.module('iow.components.form');

mod.directive('errorMessages', () => {
  return {
    restrict: 'EA',
    scope: {
      error: '='
    },
    template: require('./errorMessages.html')
  }
});
