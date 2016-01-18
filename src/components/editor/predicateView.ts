import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import IScope = angular.IScope;
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Attribute, Association, GroupListItem, Predicate, Model, Uri, states } from '../../services/entities';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';

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

class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;

  /* @ngInject */
  constructor($scope: EditableScope, $log: ILogService, deleteConfirmationModal: DeleteConfirmationModal, private predicateService: PredicateService, userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);
  }

  create(entity: Association|Attribute) {
    return this.predicateService.createPredicate(entity);
  }

  update(entity: Association|Attribute, oldId: Uri) {
    return this.predicateService.updatePredicate(entity, oldId);
  }

  remove(entity: Association|Attribute) {
    return this.predicateService.deletePredicate(entity.id, this.model.id);
  }

  rights(): Rights {
    return {
      edit: () => this.isNotReference(),
      remove: () => this.isReference() || this.predicate.state === states.unstable
    };
  }

  getEditable(): Association|Attribute {
    return this.predicate;
  }

  setEditable(editable: Association|Attribute) {
    this.predicate = editable;
  }

  isNotReference(): boolean {
    return this.predicate.definedBy.id === this.model.id;
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }
}
