import { IScope, IAttributes, ILogService } from 'angular';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ClassService } from '../../services/classService';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelPageController } from '../model/modelPage';
import { Show } from '../contracts';
import { module as mod }  from './module';
import { ErrorModal } from '../form/errorModal';
import { setSelectionStyles } from '../../utils/angular';
import { Class } from '../../entities/class';
import { Model } from '../../entities/model';
import { GroupListItem } from '../../entities/group';
import { LanguageContext } from '../../entities/contract';
import { NotificationModal } from '../common/notificationModal';

mod.directive('classView', () => {
  return {
    scope: {
      class: '=',
      model: '=',
      modelController: '=',
      show: '=',
      openPropertyId: '=',
      width: '='
    },
    restrict: 'E',
    template: require('./classView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ClassViewController,
    require: 'classView',
    link($scope: IScope, element: JQuery, _attributes: IAttributes, ctrl: ClassViewController) {
      $scope.$watchGroup([() => ctrl.width, () => ctrl.show], ([selectionWidth, show]: [number, Show]) => {
        setSelectionStyles(element, show, selectionWidth);
      });
    }
  };
});

export class ClassViewController extends EditableEntityController<Class> {

  class: Class;
  model: Model;
  modelController: ModelPageController;
  show: Show;
  openPropertyId: string;
  width: number;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              private searchPredicateModal: SearchPredicateModal,
              deleteConfirmationModal: DeleteConfirmationModal,
              errorModal: ErrorModal,
              notificationModal: NotificationModal,
              private classService: ClassService,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, errorModal, notificationModal, userService);

    this.modelController.registerView(this);
  }

  addProperty() {
    this.searchPredicateModal.openAddProperty(this.model, this.editableInEdit!)
      .then(property => {
        this.editableInEdit!.addProperty(property);
        this.openPropertyId = property.internalId.uuid;
      });
  }

  create(entity: Class) {
    return this.classService.createClass(entity)
      .then(() => this.modelController.selectionEdited(null, entity));
  }

  update(entity: Class, oldEntity: Class) {
    return this.classService.updateClass(entity, oldEntity.id).then(() => this.modelController.selectionEdited(oldEntity, entity));
  }

  remove(entity: Class) {
    return this.classService.deleteClass(entity.id, this.model).then(() => this.modelController.selectionDeleted(entity));
  }

  rights(): Rights {
    return {
      edit: () => this.belongToGroup() && !this.isReference(),
      remove: () => this.belongToGroup() && (this.isReference() || this.class.state === 'Unstable')
    };
  }

  getEditable(): Class {
    return this.class;
  }

  setEditable(editable: Class) {
    this.class = editable;
  }

  isReference(): boolean {
    return this.class.definedBy.id.notEquals(this.model.id);
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
