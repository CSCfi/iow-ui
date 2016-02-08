import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import IPromise = angular.IPromise;
import ILogService = angular.ILogService;
import { ModelController } from '../model/modelController';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ClassFormController } from './classForm';
import { ClassService } from '../../services/classService';
import { Class, GroupListItem, Model, Property } from '../../services/entities';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { collectProperties } from '../../services/utils';

export const mod = angular.module('iow.components.editor');

mod.directive('classView', () => {
  'ngInject';
  return {
    scope: {
      class: '=',
      model: '=',
      modelController: '='
    },
    restrict: 'E',
    template: require('./classView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ClassViewController
  }
});

export class ClassViewController extends EditableEntityController<Class> {

  private classForm: ClassFormController;

  class: Class;
  model: Model;
  modelController: ModelController;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              deleteConfirmationModal: DeleteConfirmationModal,
              private classService: ClassService,
              private searchPredicateModal: SearchPredicateModal,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);
    this.modelController.registerView(this);
  }

  registerForm(form: ClassFormController) {
    this.classForm = form;
  }

  addProperty() {
    const existingPredicates = collectProperties(this.class.properties, property => property.predicateId, 'Already added');

    this.searchPredicateModal.openForProperty(this.model, existingPredicates)
      .then(predicate => this.classService.newProperty(predicate.id, this.editableInEdit.properties.length))
      .then(property => {
        this.editableInEdit.addProperty(property);
        this.classForm.openPropertyAndScrollTo(property);
      });
  }

  removeProperty(property: Property) {
    this.editableInEdit.removeProperty(property);
  }

  create(entity: Class) {
    return this.classService.createClass(entity).then(() => this.modelController.selectionEdited(this.class, this.editableInEdit));
  }

  update(entity: Class, oldId: string) {
    return this.classService.updateClass(entity, oldId).then(() => this.modelController.selectionEdited(this.class, this.editableInEdit));
  }

  remove(entity: Class) {
    return this.classService.deleteClass(entity.id, this.model.id).then(() => this.modelController.selectionDeleted(this.class));
  }

  rights(): Rights {
    return {
      edit: () => this.isNotReference(),
      remove: () => this.isReference() || this.class.state === 'Unstable'
    };
  }

  getEditable(): Class {
    return this.class;
  }

  setEditable(editable: Class) {
    this.class = editable;
  }

  isNotReference(): boolean {
    return this.class.definedBy.id === this.model.id;
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }

  getRemoveText(): string {
    const text = super.getRemoveText();
    return this.isNotReference() ? text : text + ' from this ' + this.model.normalizedType;
  }
}
