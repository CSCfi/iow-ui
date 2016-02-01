import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import IScope = angular.IScope;
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Attribute, Association, GroupListItem, Model, Uri } from '../../services/entities';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelController } from '../model/modelController';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateView', () => {
  'ngInject';
  return {
    scope: {
      predicate: '=',
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PredicateViewController
  };
});

class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;
  modelController: ModelController;

  /* @ngInject */
  constructor($scope: EditableScope, $log: ILogService, deleteConfirmationModal: DeleteConfirmationModal, private predicateService: PredicateService, userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);
    this.modelController.registerView(this);
  }

  create(entity: Association|Attribute) {
    return this.predicateService.createPredicate(entity).then(() => this.modelController.selectionEdited(this.predicate, this.editableInEdit));
  }

  update(entity: Association|Attribute, oldId: Uri) {
    return this.predicateService.updatePredicate(entity, oldId).then(() => this.modelController.selectionEdited(this.predicate, this.editableInEdit));
  }

  remove(entity: Association|Attribute) {
    return this.predicateService.deletePredicate(entity.id, this.model.id).then(() => this.modelController.selectionDeleted(this.predicate));
  }

  rights(): Rights {
    return {
      edit: () => this.isNotReference(),
      remove: () => this.isReference() || this.predicate.state === 'Unstable'
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

  getRemoveText(): string {
    const text = super.getRemoveText();
    return this.isNotReference() ? text : text + ' from this ' + this.model.normalizedType;
  }
}
