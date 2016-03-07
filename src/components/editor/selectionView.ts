import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { Show } from '../../services/entities';
export const mod = angular.module('iow.components.editor');

mod.directive('selectionView', () => {
  'ngInject';
  return {
    scope: {
      show: '=',
      editableController: '='
    },
    restrict: 'E',
    template: require('./selectionView.html'),
    transclude: {
      'content': 'selectionContent',
      'buttons': '?selectionButtons'
    },
    controllerAs: 'ctrl',
    bindToController: true,
    controller: SelectionViewController
  };
});

class SelectionViewController {
  
  show: Show;

  /* @ngInject */
  constructor($scope: IScope) {
  }

  enlargeSelection() {
    this.show--;
  }

  shrinkSelection() {
    this.show++;
  }
}
