import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import IScope = angular.IScope;
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Attribute, Association, GroupListItem, Model, LanguageContext } from '../../services/entities';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelController } from '../model/model';
import { Show } from '../contracts';
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

mod.directive('predicateView', () => {
  return {
    scope: {
      predicate: '=',
      model: '=',
      modelController: '=',
      show: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PredicateViewController
  };
});

export class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;
  modelController: ModelController;
  show: Show;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              private predicateService: PredicateService,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);
    this.modelController.registerView(this);
  }

  create(entity: Association|Attribute) {
    return this.predicateService.createPredicate(entity).then(() => this.modelController.selectionEdited(null, entity));
  }

  update(entity: Association|Attribute, oldEntity: Association|Attribute) {
    return this.predicateService.updatePredicate(entity, oldEntity.id).then(() => this.modelController.selectionEdited(oldEntity, entity));
  }

  remove(entity: Association|Attribute) {
    return this.predicateService.deletePredicate(entity.id, this.model.id).then(() => this.modelController.selectionDeleted(entity));
  }

  rights(): Rights {
    return {
      edit: () => this.belongToGroup() && !this.isReference(),
      remove: () => this.belongToGroup() && (this.isReference() || this.predicate.state === 'Unstable')
    };
  }

  getEditable(): Association|Attribute {
    return this.predicate;
  }

  setEditable(editable: Association|Attribute) {
    this.predicate = editable;
  }

  isReference(): boolean {
    return this.predicate.definedBy.id.notEquals(this.model.id);
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }

  canAskForRights(): boolean {
    return this.userService.isLoggedIn() && !this.belongToGroup();
  }

  belongToGroup(): boolean {
    return this.userService.user.isMemberOf(this.getGroup());
  }

  getRemoveText(): string {
    const text = super.getRemoveText();
    return !this.isReference() ? text : text + ' from this ' + this.model.normalizedType;
  }

  openDeleteConfirmationModal() {
    const onlyDefinedInModel = this.isReference() ? this.model : null;
    return this.deleteConfirmationModal.open(this.getEditable(), this.getContext(), onlyDefinedInModel);
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
