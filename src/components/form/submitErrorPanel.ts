export const mod = angular.module('iow.components.form');

mod.directive('submitErrorPanel', () => {
  'ngInject';
  return {
    restrict: 'E',
    template: require('./submitErrorPanel.html'),
    scope: {
      error: '='
    }
  };
});
