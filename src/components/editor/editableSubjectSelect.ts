import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { SearchConceptModal } from './searchConceptModal';
import { Type, Model, Concept } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';
import { module as mod }  from './module';

mod.directive('editableSubjectSelect', () => {
  return {
    scope: {
      subject: '=',
      type: '@',
      disable: '=',
      model: '='
    },
    restrict: 'E',
    controllerAs: 'ctrl',
    bindToController: true,
    template: require('./editableSubjectSelect.html'),
    require: ['editableSubjectSelect', '?^form'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, formController]: [EditableSubjectSelectController, EditableForm]) {
      thisController.isEditing = () => formController.editing;
    },
    controller: EditableSubjectSelectController
  };
});

class EditableSubjectSelectController {

  isEditing: () => boolean;
  subject: Concept;
  type: Type;
  model: Model;

  /* @ngInject */
  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectSubject() {
    this.searchConceptModal.openSelection(this.model.vocabularies, this.model, this.type).then(concept => this.subject = concept);
  }
}
