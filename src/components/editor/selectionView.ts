import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import ITranscludeFunction = angular.ITranscludeFunction;
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
      'selectionContent': 'content',
      'selectionButtons': 'buttons',
      'selectionVisualization': '?visualization'
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
