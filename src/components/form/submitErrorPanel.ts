export const mod = angular.module('iow.components.form');

mod.directive('submitErrorPanel', () => {
  return {
    restrict: 'E',
    template: require('./submitErrorPanel.html'),
    scope: {
      error: '='
    }
  };
});
