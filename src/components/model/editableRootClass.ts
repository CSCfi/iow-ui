import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { EditableForm } from '../form/editableEntityController';
import { Model, ClassListItem } from '../../services/entities';
import { SearchClassModal } from '../editor/searchClassModal';

export const mod = angular.module('iow.components.model');

mod.directive('editableRootClass', () => {
  return {
    scope: {
      model: '='
    },
    restrict: 'E',
    template: require('./editableRootClass.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['editableRootClass', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableRootClassController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableRootClassController
  };
});

class EditableRootClassController {

  model: Model;
  isEditing: () => boolean;

  /* @ngInject */
  constructor(private searchClassModal: SearchClassModal) {
  }

  get href() {
    return '#' + this.model.linkTo('class', this.model.rootClass);
  }

  selectClass() {

    const exclude = (klass: ClassListItem) => {
      if (klass.definedBy.id.notEquals(this.model.id)) {
        return 'Can be selected only from this ' + this.model.normalizedType;
      } else {
        return null;
      }
    };

    this.searchClassModal.openWithOnlySelection(this.model, exclude).then(klass => this.model.rootClass = klass.id);
  }
}
