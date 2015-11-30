import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IPromise = angular.IPromise;
import ILogService = angular.ILogService;
import { ModelController } from '../model/modelController';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ClassFormController } from './classForm';
import { ClassService } from '../../services/classService';
import { Class, GroupListItem, Model, Property, Uri, states } from '../../services/entities';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from '../../services/userService';
import { ConfirmationModal } from '../common/confirmationModal';

export const mod = angular.module('iow.components.editor');

mod.directive('classView', () => {
  'ngInject';
  return {
    scope: {
      class: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./classView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['classView', '^ngController'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller: ClassViewController
  }
});

export class ClassViewController extends EditableEntityController<Class> {

  private classForm: ClassFormController;
  class: Class;
  model: Model;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              confirmationModal: ConfirmationModal,
              private classService: ClassService,
              private searchPredicateModal: SearchPredicateModal,
              userService: UserService) {
    super($scope, $log, confirmationModal, userService);
  }

  registerForm(form: ClassFormController) {
    this.classForm = form;
  }

  addProperty() {
    this.searchPredicateModal.openWithPredicationCreation(this.model)
      .then(predicate => this.classService.newProperty(predicate.id))
      .then(property => {
        this.editableInEdit.addProperty(property);
        this.classForm.openPropertyAndScrollTo(property);
      });
  }

  removeProperty(property: Property) {
    this.editableInEdit.removeProperty(property);
  }

  create(entity: Class) {
    return this.classService.createClass(entity);
  }

  update(entity: Class, oldId: string) {
    return this.classService.updateClass(entity, oldId);
  }

  remove(entity: Class) {
    return this.classService.deleteClass(entity.fullId(), this.model.id);
  }

  rights(): Rights {
    return {
      edit: () => this.userService.isLoggedIn() && this.class.modelId === this.model.id,
      remove: () => this.userService.isLoggedIn() && this.class.state === states.unstable
    };
  }

  getEditable(): Class {
    return this.class;
  }

  setEditable(editable: Class) {
    this.class = editable;
  }

  isDefinedInThisModel(): boolean {
    return this.class.modelId === this.model.id;
  }

  getRemoveText(): string {
    if (this.isDefinedInThisModel()) {
      return super.getRemoveText();
    } else {
      return 'Delete class from this model';
    }
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }
}
