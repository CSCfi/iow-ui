export const mod = angular.module('iow.components.editor');

mod.directive('selectionView', () => {
  'ngInject';
  return {
    scope: {
      editableController: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    transclude: {
      'selectionContent': 'content',
      'selectionButtons': 'buttons',
      'selectionVisualization': 'visualization'
    }
  };
});
