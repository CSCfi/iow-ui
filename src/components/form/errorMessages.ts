
export const mod = angular.module('iow.components.form');

mod.directive('errorMessages', () => {
  return {
    restrict: 'EA',
    scope: {
      ngModelController: '='
    },
    template: require('./errorMessages.html')
  }
});
