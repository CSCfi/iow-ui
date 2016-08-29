import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ILogService = angular.ILogService;
import IQService = angular.IQService;
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Model, LanguageContext, Concept, GroupListItem, ConceptSuggestion, Usage } from '../../services/entities';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { module as mod }  from './module';
import { ConceptEditorModalController } from './conceptEditorModal';
import { ConceptService } from '../../services/conceptService';
import { UsageService } from '../../services/usageService';
import { all } from '../../utils/array';
import { ErrorModal } from '../form/errorModal';

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
  usage: Usage;
  loading: boolean = true;

  /* @ngInject */
  constructor($scope: EditableScope,
              private $q: IQService,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              userService: UserService,
              private conceptService: ConceptService,
              usageService: UsageService) {
    super($scope, $log, deleteConfirmationModal, errorModal, userService);

    this.modelController.registerView(this);

    $scope.$watch(() => this.concept, concept => {
      this.loading = true;
      if (concept) {
        usageService.getUsage(concept).then(usage => {
          this.usage = usage;
          this.loading = false;
        });
      } else {
        this.usage = null;
      }
    });
  }

  create(entity: Concept) {
    return this.$q.reject('Concept creation is not possible');
  }

  update(entity: Concept, oldEntity: Concept) {
    if (entity instanceof ConceptSuggestion) {
      return this.conceptService.updateConceptSuggestion(entity).then(() => this.modelController.selectionEdited(entity));
    } else {
      return this.$q.reject('Entity must be instance of ConceptSuggestion');
    }
  }

  remove(entity: Concept) {
    return this.conceptService.deleteConceptFromModel(entity, this.model).then(() => this.modelController.selectionDeleted(entity));
  }

  isNotInUseInThisModel() {
    return this.usage && all(this.usage.referrers, referrer => referrer.definedBy.id.notEquals(this.model.id));
  }

  isNotInUse() {
    return this.usage && this.usage.referrers.length === 0;
  }

  rights(): Rights {
    return {
      edit: () => !this.loading && !this.isReference() && this.userService.user.isMemberOf(this.model.group),
      remove: () => !this.loading && this.isNotInUseInThisModel() && this.userService.user.isMemberOf(this.model.group)
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
    return !(concept instanceof ConceptSuggestion && (!concept.definedBy || concept.definedBy.id.equals(this.model.id)));
  }

  getRemoveText(): string {
    const text = super.getRemoveText();
    return this.isNotInUse() ? text : text + ' from this ' + this.model.normalizedType;
  }

  openDeleteConfirmationModal() {
    const onlyDefinedInModel = this.isReference() ? this.model : null;
    return this.deleteConfirmationModal.open(this.getEditable(), this.getContext(), onlyDefinedInModel);
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
