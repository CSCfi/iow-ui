import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ILogService = angular.ILogService;
import IQService = angular.IQService;
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Model, LanguageContext, Concept, GroupListItem, ConceptSuggestion } from '../../services/entities';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { ConceptEditorModalController } from './conceptEditorModal';

mod.directive('conceptView', () => {
  return {
    scope: {
      concept: '=',
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./conceptView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ConceptViewController
  };
});

export class ConceptViewController extends EditableEntityController<Concept> {

  concept: Concept;
  model: Model;
  modelController: ConceptEditorModalController;

  /* @ngInject */
  constructor($scope: EditableScope,
              private $q: IQService,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);

    this.modelController.registerView(this);
  }

  create(entity: Concept) {
    // TODO
    return this.$q.reject();
  }

  update(entity: Concept, oldId: Uri) {
    // TODO
    return this.$q.reject();
  }

  remove(entity: Concept) {
    // TODO
    return this.$q.reject();
  }

  isNotInUse() {
    // TODO
    return true;
  }

  rights(): Rights {
    return {
      edit: () => !this.isReference() && this.userService.user.isMemberOf(this.model.group),
      remove: () => this.isNotInUse() && this.userService.user.isMemberOf(this.model.group)
    };
  }

  canAskForRights(): boolean {
    return this.userService.isLoggedIn() && !this.belongToGroup();
  }

  belongToGroup(): boolean {
    return this.userService.user.isMemberOf(this.getGroup());
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }

  getEditable(): Concept {
    return this.concept;
  }

  setEditable(editable: Concept) {
    this.concept = editable;
  }

  isReference(): boolean {
    const concept = this.concept;
    return !(concept instanceof ConceptSuggestion && concept.definedBy.id.equals(this.model.id));
  }

  getRemoveText(): string {
    return 'Remove concept';
  }

  openDeleteConfirmationModal() {
    return this.deleteConfirmationModal.open(this.getEditable(), this.isReference() ? this.model : null);
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
