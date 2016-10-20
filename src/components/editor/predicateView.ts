import { IScope, IAttributes, ILogService } from 'angular';
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelPageController } from '../model/model';
import { Show } from '../contracts';
import { ErrorModal } from '../form/errorModal';
import { module as mod }  from './module';
import { setSelectionStyles } from '../../utils/angular';
import { Association, Attribute } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { GroupListItem } from '../../entities/group';
import { LanguageContext } from '../../entities/contract';
import { NotificationModal } from '../common/notificationModal';

mod.directive('predicateView', () => {
  return {
    scope: {
      predicate: '=',
      model: '=',
      modelController: '=',
      show: '=',
      width: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PredicateViewController,
    require: 'predicateView',
    link($scope: IScope, element: JQuery, _attributes: IAttributes, ctrl: PredicateViewController) {
      $scope.$watchGroup([() => ctrl.width, () => ctrl.show], ([selectionWidth, show]: [number, Show]) => {
        setSelectionStyles(element, show, selectionWidth);
      });
    }
  };
});

export class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;
  modelController: ModelPageController;
  show: Show;
  width: number;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              notificationModal: NotificationModal,
              private predicateService: PredicateService,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, errorModal, notificationModal, userService);
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
