import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';
import { Model, Constraint, ConstraintListItem, RelativeUrl, ClassListItem } from '../../services/entities';
import { SearchClassModal } from './searchClassModal';
import {
  collectProperties,
  createExistsExclusion,
  createDefinedByExclusion,
  combineExclusions,
  createClassTypeExclusion,
  SearchClassType
} from '../../services/utils';

export const mod = angular.module('iow.components.editor');

mod.directive('editableConstraint', () => {
  'ngInject';
  return {
    scope: {
      constraint: '=',
      model: '=',
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableConstraint.html'),
    require: ['editableConstraint', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: [EditableConstraint, EditableForm]) {
      controllers[0].isEditing = () => controllers[1].editing;
    },
    controller: EditableConstraint
  };
});

class EditableConstraint {

  constraint: Constraint;
  model: Model;
  isEditing: () => boolean;

  /* @ngInject */
  constructor(private searchClassModal: SearchClassModal) {
  }

  linkItem(item: ConstraintListItem): RelativeUrl {
    return this.model.linkTo('class', item.shapeId);
  }

  addItem() {
    const exclude = combineExclusions<ClassListItem>(
      createClassTypeExclusion(SearchClassType.SpecializedClass),
      createExistsExclusion(collectProperties(this.constraint.items, item => item.shapeId.uri)),
      createDefinedByExclusion(this.model)
    );

    this.searchClassModal.openWithOnlySelection(this.model, exclude).then(klass => this.constraint.addItem(klass));
  }

  removeItem(item: ConstraintListItem) {
    this.constraint.removeItem(item);
  }
}
