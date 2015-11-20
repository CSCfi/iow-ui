export const mod = angular.module('iow.components.form');

mod.directive('editableButtons', () => {
  return {
    restrict: 'E',
    scope: {
      ctrl: '=editableController'
    },
    template: require('./editableButtons.html'),
    transclude: true
  };
});
