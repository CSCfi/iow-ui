import { IAttributes, IScope } from 'angular';
import { EditableForm } from '../form/editableEntityController';
import { SearchClassModal } from './searchClassModal';
import { SearchClassType } from '../contracts';
import {
  createClassTypeExclusion, createExistsExclusion, createDefinedByExclusion,
  createSelfExclusion, combineExclusions
} from '../../utils/exclusion';
import { collectProperties } from '../../utils/array';
import { module as mod }  from './module';
import { Constraint, Class, ConstraintListItem, ClassListItem } from '../../entities/class';
import { Model } from '../../entities/model';
import { ConstraintType } from '../../entities/type';

mod.directive('editableConstraint', () => {
  return {
    scope: {
      constraint: '=',
      model: '=',
      class: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableConstraint.html'),
    require: ['editableConstraint', '?^form'],
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, formController]: [EditableConstraint, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableConstraint
  };
});

class EditableConstraint {

  constraint: Constraint;
  model: Model;
  class: Class;
  isEditing: () => boolean;
  types: ConstraintType[] = ['or', 'and', 'not'];

  /* @ngInject */
  constructor(private searchClassModal: SearchClassModal) {
  }

  linkItem(item: ConstraintListItem) {
    return this.model.linkToResource(item.shapeId);
  }

  addItem() {
    const exclude = combineExclusions<ClassListItem>(
      createClassTypeExclusion(SearchClassType.SpecializedClass),
      createExistsExclusion(collectProperties(this.constraint.items, item => item.shapeId.uri)),
      createDefinedByExclusion(this.model),
      createSelfExclusion(this.class)
    );

    this.searchClassModal.openWithOnlySelection(this.model, true, exclude).then(klass => this.constraint.addItem(klass));
  }

  removeItem(item: ConstraintListItem) {
    this.constraint.removeItem(item);
  }
}
