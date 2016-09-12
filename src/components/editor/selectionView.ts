import { IScope } from 'angular';
import { Show } from '../contracts';
import { module as mod }  from './module';

mod.directive('selectionView', () => {
  return {
    scope: {
      show: '=',
      editableController: '=',
      model: '='
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
