import IAttributes = angular.IAttributes;
import IFormController = angular.IFormController;
import IPromise = angular.IPromise;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';
import { Model, Uri, Constraint, ConstraintListItem, RelativeUrl } from '../../services/entities';
import { SearchClassModal, SearchClassType } from './searchClassModal';

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
    return this.model.linkTo('class', item.shapeId, this.model);
  }

  addItem() {
    const excluded = new Map<Uri, string>();

    for(const item of this.constraint.items) {
      excluded.set(this.model.expandCurie(item.shapeId).uri, 'Already added');
    }

    this.searchClassModal.openWithOnlySelection(this.model, SearchClassType.SpecializedClass, excluded).then(klass => this.constraint.addItem(klass));
  }

  removeItem(item: ConstraintListItem) {
    this.constraint.removeItem(item);
  }
}
