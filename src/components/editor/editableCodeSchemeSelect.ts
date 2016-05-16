import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { Model, CodeScheme } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';
import { SearchCodeSchemeModal } from '../model/searchCodeSchemeModal';
import { module as mod }  from './module';

mod.directive('editableCodeSchemeSelect', () => {
  return {
    scope: {
      codeScheme: '=',
      model: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableCodeSchemeSelect.html'),
    require: ['editableCodeSchemeSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableCodeSchemeSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableCodeSchemeSelectController
  };
});

class EditableCodeSchemeSelectController {

  isEditing: () => boolean;
  codeScheme: CodeScheme;
  model: Model;

  /* @ngInject */
  constructor(private searchCodeSchemeModal: SearchCodeSchemeModal) {
  }

  selectCodeScheme() {
    this.searchCodeSchemeModal.openSelectionForProperty(this.model).then(codeScheme => this.codeScheme = codeScheme);
  }
}
