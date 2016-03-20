import IScope = angular.IScope;
import { HistoryModal } from './historyModal';
import { Model, Predicate, Class } from '../../services/entities';
import { module as mod }  from './module';

mod.directive('history', () => {
  return {
    restrict: 'E',
    scope: {
      model: '=',
      resource: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    template: `<button type="button" class="btn btn-default right" ng-click="ctrl.openHistory()" translate>Show history</button>`,
    controller: HistoryController
  };
});

class HistoryController {

  model: Model;
  resource: Class|Predicate|Model;

  /* @ngInject */
  constructor(private historyModal: HistoryModal) {
  }

  openHistory() {
    this.historyModal.open(this.model, this.resource);
  }
}
