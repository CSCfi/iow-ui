import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
export const mod = angular.module('iow.components.editor');

mod.directive('selectionView', () => {
  'ngInject';
  return {
    scope: {
      editableController: '=',
      hideVisualization: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    transclude: {
      'content': 'selectionContent',
      'buttons': '?selectionButtons',
      'visualization': '?selectionVisualization'
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller() {
      this.visCollapsed = false;
      this.contentCollapsed = false;

      return {
        collapseVisualization() {
          this.visCollapsed = !this.visCollapsed;
        },
        collapseContent() {
          this.contentCollapsed = !this.contentCollapsed;
        }
      };
    }
  };
});
