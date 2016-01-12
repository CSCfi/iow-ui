import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
export const mod = angular.module('iow.components.editor');

export enum Show {
  Selection = 0, Both = 1, Visualization = 2
}

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
    controller: SelectionViewController
  };
});

class SelectionViewController {
  show: Show = Show.Both;
  hideVisualization: boolean;

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watch(() => this.hideVisualization, hide => this.show = hide ? Show.Selection : Show.Both);
  }

  enlargeSelection() {
    this.show--;
  }

  shrinkSelection() {
    this.show++;
  }

  enlargeVisualization() {
    this.show++;
  }

  shrinkVisualization() {
    this.show--;
  }

  classForVisualization() {
    switch (this.show) {
      case Show.Both:
        return 'col-md-5';
      case Show.Selection:
        return 'hide';
      case Show.Visualization:
        return 'col-md-12';
    }
  }

  classForSelection() {
    switch (this.show) {
      case Show.Both:
        return 'col-md-7';
      case Show.Selection:
        return 'col-md-12';
      case Show.Visualization:
        return 'hide';
    }
  }
}
