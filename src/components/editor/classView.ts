import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ILogService = angular.ILogService;
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ClassFormController } from './classForm';
import { ClassService } from '../../services/classService';
import { Class, GroupListItem, Model, Property, PredicateListItem, Uri } from '../../services/entities';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import {
  collectProperties,
  createExistsExclusion,
  combineExclusions,
  createDefinedByExclusion
} from '../../services/utils';
import { ModelController } from '../model/model';
import { Show } from '../contracts';

export const mod = angular.module('iow.components.editor');

mod.directive('classView', () => {
  return {
    scope: {
      class: '=',
      model: '=',
      modelController: '=',
      show: '='
    },
    restrict: 'E',
    template: require('./classView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ClassViewController
  };
});

export class ClassViewController extends EditableEntityController<Class> {

  private classForm: ClassFormController;

  class: Class;
  model: Model;
  modelController: ModelController;
  show: Show;

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
    const exclude = combineExclusions<PredicateListItem>(
      createExistsExclusion(collectProperties(this.class.properties, property => property.predicate.uri)),
      createDefinedByExclusion(this.model)
    );

    this.searchPredicateModal.openForProperty(this.model, exclude)
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
    return this.classService.createClass(entity)
      .then(() => this.modelController.selectionEdited(this.class, this.editableInEdit));
  }

  update(entity: Class, oldId: Uri) {
    return this.classService.updateClass(entity, oldId).then(() => this.modelController.selectionEdited(this.class, this.editableInEdit));
  }

  remove(entity: Class) {
    return this.classService.deleteClass(entity.id, this.model.id).then(() => this.modelController.selectionDeleted(this.class));
  }

  rights(): Rights {
    return {
      edit: () => !this.isReference(),
      remove: () => this.isReference() || this.class.state === 'Unstable'
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

  getRemoveText(): string {
    const text = super.getRemoveText();
    return !this.isReference() ? text : text + ' from this ' + this.model.normalizedType;
  }

  openDeleteConfirmationModal() {
    return this.deleteConfirmationModal.open(this.getEditable(), this.isReference() ? this.model : null);
  }
}
