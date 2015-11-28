export const mod = angular.module('iow.components.form');

mod.directive('editableEntityButtons', () => {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController'
    },
    template: require('./editableEntityButtons.html'),
    transclude: true
  };
});
