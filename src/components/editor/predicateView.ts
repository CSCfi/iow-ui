import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import IScope = angular.IScope;
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableController, EditableScope, Rights } from '../form/editableController';
import { Predicate, Model, Uri } from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateView', () => {
  'ngInject';
  return {
    scope: {
      predicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['predicateView', '^ngController'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller: PredicateViewController
  };
});

class PredicateViewController extends EditableController<Predicate> {

  predicate: Predicate;
  model: Model;

  /* @ngInject */
  constructor($scope: EditableScope, $log: ILogService, confirmationModal: ConfirmationModal, private predicateService: PredicateService, private userService: UserService) {
    super($scope, $log, confirmationModal, userService);
  }

  create(entity: Predicate) {
    return this.predicateService.createPredicate(entity);
  }

  update(entity: Predicate, oldId: Uri) {
    return this.predicateService.updatePredicate(entity, oldId);
  }

  remove(entity: Predicate) {
    return this.predicateService.deletePredicate(entity.id, this.model.id);;
  }

  rights(): Rights {
    return {
      edit: () => this.userService.isLoggedIn() && this.predicate.modelId === this.model.id,
      remove: () => this.userService.isLoggedIn()
    };
  }

  getEditable(): Predicate {
    return this.predicate;
  }

  setEditable(editable: Predicate) {
    this.predicate = editable;
  }
}
