import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import ILogService = angular.ILogService;
import IQService = angular.IQService;
import IScope = angular.IScope;
import * as _ from 'lodash';
import { ChoosePredicateTypeModal } from './choosePredicateTypeModal';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { ClassService } from '../../services/classService';
import {
  Class, GroupListItem, Model, PredicateListItem, Predicate,
  LanguageContext
} from '../../services/entities';
import { SearchPredicateModal } from './searchPredicateModal';
import { UserService } from '../../services/userService';
import { DeleteConfirmationModal } from '../common/deleteConfirmationModal';
import { ModelController } from '../model/model';
import { Show } from '../contracts';
import { Uri } from '../../services/uri';
import { collectProperties } from '../../utils/entity';
import { createDefinedByExclusion, createExistsExclusion, combineExclusions } from '../../utils/exclusion';
import { module as mod }  from './module';

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

  class: Class;
  model: Model;
  modelController: ModelController;
  show: Show;
  openPropertyId: string;

  /* @ngInject */
  constructor($scope: EditableScope,
              $log: ILogService,
              $location: ILocationService,
              private searchPredicateModal: SearchPredicateModal,
              private choosePredicateTypeModal: ChoosePredicateTypeModal,
              deleteConfirmationModal: DeleteConfirmationModal,
              private classService: ClassService,
              userService: UserService) {
    super($scope, $log, deleteConfirmationModal, userService);

    this.openPropertyId = $location.search().property;
    $scope.$watch(() => this.openPropertyId, id => $location.search('property', id));

    this.modelController.registerView(this);
  }

  addProperty() {
    const exclude = combineExclusions<PredicateListItem>(
      createExistsExclusion(collectProperties(_.filter(this.editableInEdit.properties, p => p.isAttribute()), p => p.predicateId.uri)),
      createDefinedByExclusion(this.model)
    );

    this.searchPredicateModal.openForProperty(this.model, exclude)
      .then(result => {
        if (result instanceof Predicate && result.normalizedType === 'property') {
          return this.choosePredicateTypeModal.open().then(type => {
            return this.classService.newProperty(result, type, this.model);
          });
        } else {
          return this.classService.newProperty(result, result.normalizedType, this.model);
        }
      })
      .then(property => {
        this.editableInEdit.addProperty(property);
        this.openPropertyId = property.internalId.uri;
      });
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
    return this.deleteConfirmationModal.open(this.getEditable(), this.isReference() ? this.model : null);
  }

  getContext(): LanguageContext {
    return this.model;
  }
}
