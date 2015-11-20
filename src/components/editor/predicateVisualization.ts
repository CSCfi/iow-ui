export const mod = angular.module('iow.components.editor');

mod.directive('predicateVisualization', () => {
  return {
    restrict: 'E',
    scope: {
      data: '='
    },
    template: '<div></div>'
  }
});
