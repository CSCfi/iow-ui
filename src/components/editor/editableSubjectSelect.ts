import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { SearchConceptModal } from './searchConceptModal';
import { ConceptSuggestion, Reference, Type, FintoConcept } from '../../services/entities';
import { EditableForm } from '../form/editableEntityController';

import { module as mod }  from './module';


mod.directive('editableSubjectSelect', () => {
  return {
    scope: {
      subject: '=',
      references: '=',
      type: '@',
      disable: '='
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
  subject: FintoConcept|ConceptSuggestion;
  references: Reference[];
  type: Type;

  /* @ngInject */
  constructor(private searchConceptModal: SearchConceptModal) {
  }

  selectSubject() {
    this.searchConceptModal.openSelection(this.references, this.type).then(concept => this.subject = concept);
  }
}
